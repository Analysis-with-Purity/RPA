import type {
  ActivityEvent,
  DashboardStats,
  Ticket,
  TicketPriority,
  TicketVolumePoint,
} from "@/lib/types";
import {
  ENTITY_TICKET,
  ENTITY_TICKET_AUDIT,
  findTicketByTicketId,
  queryRecords,
  updateRecord,
  type DfRecord,
} from "@/lib/server/data-fabric";
import {
  priorityFromEntity,
  recordIdOf,
  statusToEntity,
  toTicket,
} from "@/lib/server/ticket-mapper";
import type { TicketQuery, UpdateTicketBody } from "@/lib/server/ticket-store";

/**
 * Reads tickets from the `Ticket` Data Fabric entity — the tenant's system of record.
 *
 * Creation is deliberately absent from this module. A ticket is created by putting it on
 * Q_Intake and letting the robot write the record, so the automation stays the single
 * writer for new tickets and owns the Status guarantee. This module reads that result and
 * applies post-creation updates.
 *
 * Filtering and sorting happen in memory. Data Fabric's query filters are exact-match only
 * — no substring search — so the text search the UI offers cannot be pushed down. At this
 * data volume one bounded fetch is cheaper than several round trips; `MAX_FETCH` is the
 * ceiling and `truncated` reports when it bites.
 */

const MAX_FETCH = 1000;

const PRIORITY_RANK: Record<TicketPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

async function fetchAll(): Promise<{ tickets: Ticket[]; truncated: boolean }> {
  const { value, totalRecordCount } = await queryRecords<DfRecord>(ENTITY_TICKET, {
    limit: MAX_FETCH,
    sortOptions: [{ fieldName: "CreatedDate", isDescending: true }],
  });

  return {
    tickets: value.map(toTicket),
    truncated: totalRecordCount > value.length,
  };
}

function matches(ticket: Ticket, q: TicketQuery): boolean {
  if (q.status && q.status !== "all" && ticket.status !== q.status) return false;
  if (q.priority && q.priority !== "all" && ticket.priority !== q.priority) return false;
  if (q.departmentId && q.departmentId !== "all" && ticket.departmentId !== q.departmentId) {
    return false;
  }
  if (q.search) {
    const s = q.search.toLowerCase();
    const hit =
      ticket.subject.toLowerCase().includes(s) ||
      ticket.id.toLowerCase().includes(s) ||
      ticket.tags.some((t) => t.toLowerCase().includes(s));
    if (!hit) return false;
  }
  return true;
}

export async function listTickets(
  q: TicketQuery = {},
): Promise<{ tickets: Ticket[]; total: number; truncated: boolean }> {
  const { tickets, truncated } = await fetchAll();
  const filtered = tickets.filter((t) => matches(t, q));

  filtered.sort((a, b) => {
    if (q.sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (q.sort === "priority") {
      return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { tickets: filtered, total: filtered.length, truncated };
}

/**
 * Builds the ticket that will be put on Q_Intake. Nothing is persisted here — the robot
 * writes the record, so this is the payload, not the stored row.
 *
 * The id is time-ordered and random-suffixed rather than a counter: with Data Fabric as the
 * source of truth there is no local sequence to increment, and two app instances must not
 * be able to mint the same id.
 */
export function draftTicket(body: {
  subject: string;
  description: string;
  categoryId: string;
  departmentId: string;
  priority?: TicketPriority;
  tags?: string[];
  requesterName?: string;
  requesterEmail?: string;
}): Ticket {
  const now = new Date().toISOString();
  const id = `TCK-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;

  const email = body.requesterEmail?.trim() || "unknown@example.com";

  return {
    id,
    subject: body.subject,
    description: body.description,
    // The automation owns the real status; this is only what the UI echoes back on submit.
    status: "submitted",
    priority: body.priority ?? "medium",
    categoryId: body.categoryId,
    departmentId: body.departmentId,
    tags: body.tags ?? [],
    requester: {
      id: `req-${email.toLowerCase()}`,
      name: body.requesterName?.trim() || email,
      email,
    },
    attachmentIds: [],
    messageCount: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Status history and automation activity, read from the TicketAudit entity.
 *
 * Every automation that touches a ticket writes a row here, so this is a genuine record of
 * what the robots did — not a UI-side reconstruction. Rows written by a workflow are
 * attributed to the `system` actor so the timeline can distinguish them from human actions.
 */
export async function listActivity(ticketId: string): Promise<ActivityEvent[]> {
  const { value } = await queryRecords<DfRecord>(ENTITY_TICKET_AUDIT, {
    filterGroup: {
      logicalOperator: 0,
      queryFilters: [{ fieldName: "TicketId", operator: "=", value: ticketId }],
    },
    limit: 200,
  });

  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  return value
    .map((r): ActivityEvent => {
      const action = str(r.Action);
      const performedBy = str(r.PerformedBy) || "Automation";
      // An audit row written by a workflow names the workflow in PerformedBy; a human action
      // carries an email. Anything without an "@" is treated as an automation.
      const isHuman = performedBy.includes("@");

      return {
        id: str(r.AuditId) || str(r.Id),
        ticketId,
        type: activityTypeFromAction(action),
        actor: {
          id: isHuman ? `agent-${performedBy}` : "automation",
          name: performedBy,
          role: isHuman ? "agent" : "system",
        },
        fromValue: str(r.FromValue) || undefined,
        toValue: str(r.ToValue) || undefined,
        createdAt: str(r.Timestamp) || str(r.CreateTime) || new Date(0).toISOString(),
      };
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Audit actions are free text; map the ones the UI has an icon for, default to a status change. */
function activityTypeFromAction(action: string): ActivityEvent["type"] {
  const a = action.trim().toLowerCase();
  if (a === "created" || a === "intake") return "created";
  if (a === "assigned") return "assigned";
  if (a === "reopened") return "reopened";
  if (a.includes("priority")) return "priority_changed";
  return "status_changed";
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  const record = await findTicketByTicketId(id);
  return record ? toTicket(record) : undefined;
}

/**
 * Applies a post-creation update. Requires a round trip to resolve the entity's GUID —
 * `TicketId` is the app's key, but Data Fabric updates address rows by `Id`.
 */
export async function updateTicket(
  id: string,
  body: UpdateTicketBody,
): Promise<Ticket | undefined> {
  const existing = await findTicketByTicketId(id);
  if (!existing) return undefined;

  const patch: DfRecord = { Id: recordIdOf(existing) };
  if (body.status) patch.Status = statusToEntity(body.status);
  if (body.priority) patch.Priority = body.priority;
  if (body.assignedAgentId) patch.Assigned = true;

  // Nothing mappable was sent — return current state rather than issue an empty update.
  if (Object.keys(patch).length === 1) return toTicket(existing);

  await updateRecord(ENTITY_TICKET, patch);

  // Re-read rather than trust the echo: update-batch returns only a partial row, so merging
  // it over the pre-update record silently reports the old status back to the caller even
  // though the write succeeded. One extra round trip buys a response that matches storage.
  const fresh = await findTicketByTicketId(id);
  return fresh ? toTicket(fresh) : undefined;
}

// ------------------------------------------------------------------- dashboard stats

const SMOOTHING_WINDOW_DAYS = 3;

function buildVolumeTrend(tickets: Ticket[], days: number): TicketVolumePoint[] {
  const now = Date.now();
  const lookback = days + SMOOTHING_WINDOW_DAYS - 1;
  const daily: { date: string; opened: number; resolved: number }[] = [];

  for (let i = lookback - 1; i >= 0; i--) {
    const dayKey = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    daily.push({
      date: dayKey,
      opened: tickets.filter((t) => t.createdAt.slice(0, 10) === dayKey).length,
      resolved: tickets.filter((t) => t.resolvedAt?.slice(0, 10) === dayKey).length,
    });
  }

  const smoothed: TicketVolumePoint[] = [];
  for (let i = daily.length - days; i < daily.length; i++) {
    const window = daily.slice(Math.max(0, i - SMOOTHING_WINDOW_DAYS + 1), i + 1);
    smoothed.push({
      date: daily[i].date,
      opened: Math.round((window.reduce((s, d) => s + d.opened, 0) / window.length) * 10) / 10,
      resolved:
        Math.round((window.reduce((s, d) => s + d.resolved, 0) / window.length) * 10) / 10,
    });
  }
  return smoothed;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { tickets } = await fetchAll();

  const openCount = tickets.filter((t) =>
    ["submitted", "assigned", "in_progress"].includes(t.status),
  ).length;
  const pendingCount = tickets.filter((t) => t.status === "awaiting_customer").length;
  const resolvedCount = tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;

  // The entity records neither first-response nor satisfaction, so these read as 0 rather
  // than being estimated. A fabricated average is worse than an honest zero on a dashboard.
  return {
    openCount,
    pendingCount,
    resolvedCount,
    avgResponseTimeHours: 0,
    avgResolutionTimeHours: 0,
    satisfactionScore: 0,
    ticketVolumeTrend: buildVolumeTrend(tickets, 30),
  };
}

export async function findDuplicates(subject: string, description: string) {
  const { tickets } = await fetchAll();

  const tokenize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );

  const queryTokens = tokenize(`${subject} ${description}`);
  if (queryTokens.size === 0) return [];

  return tickets
    .map((ticket) => {
      const ticketTokens = tokenize(ticket.subject);
      let overlap = 0;
      for (const token of ticketTokens) if (queryTokens.has(token)) overlap += 1;
      return {
        ticketId: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        score: overlap / Math.max(3, ticketTokens.size),
      };
    })
    .filter((m) => m.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export { priorityFromEntity };
