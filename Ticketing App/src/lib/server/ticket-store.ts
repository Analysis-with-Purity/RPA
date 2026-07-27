import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  Message,
  ActivityEvent,
  MessageAuthorRole,
  DashboardStats,
  TicketVolumePoint,
} from "@/lib/types";
import {
  tickets as seedTickets,
  messages as seedMessages,
  activityEvents as seedActivity,
  nextMessageId,
  nextActivityId,
} from "@/lib/mock-data/seed";
import { CURRENT_CUSTOMER } from "@/lib/mock-data/customer";
import { getAgentById } from "@/lib/mock-data/agents";

/**
 * In-memory, server-side store. This is the single source of truth for the
 * PoC: both the web UI and UiPath robots read/write through it via /api/v1.
 * Data lives in process memory and RESETS when the server restarts — swap this
 * module for a real database (Prisma/Postgres) later without touching callers.
 *
 * A globalThis guard keeps the same arrays across dev hot-reloads so writes
 * aren't lost while iterating.
 */
interface StoreState {
  tickets: Ticket[];
  messages: Message[];
  activity: ActivityEvent[];
  seq: number;
}

const globalRef = globalThis as unknown as { __purityStore?: StoreState };

function highestTicketNumber(tickets: Ticket[]): number {
  return tickets.reduce((max, t) => {
    const n = Number.parseInt(t.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 1000);
}

const store: StoreState =
  globalRef.__purityStore ??
  (globalRef.__purityStore = {
    tickets: [...seedTickets],
    messages: [...seedMessages],
    activity: [...seedActivity],
    seq: highestTicketNumber(seedTickets),
  });

function nextTicketId(): string {
  store.seq += 1;
  return `TCK-${store.seq}`;
}

// ---------------------------------------------------------------------------
// Filtering + sorting (moved from the former client-side lib/api/tickets.ts)
// ---------------------------------------------------------------------------

export interface TicketQuery {
  search?: string;
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  departmentId?: string | "all";
  sort?: "newest" | "oldest" | "priority";
}

const PRIORITY_RANK: Record<TicketPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

function matches(ticket: Ticket, q: TicketQuery) {
  if (q.status && q.status !== "all" && ticket.status !== q.status) return false;
  if (q.priority && q.priority !== "all" && ticket.priority !== q.priority) return false;
  if (q.departmentId && q.departmentId !== "all" && ticket.departmentId !== q.departmentId) {
    return false;
  }
  if (q.search) {
    const s = q.search.toLowerCase();
    if (
      !ticket.subject.toLowerCase().includes(s) &&
      !ticket.id.toLowerCase().includes(s) &&
      !ticket.tags.some((t) => t.toLowerCase().includes(s))
    ) {
      return false;
    }
  }
  return true;
}

export function listTickets(q: TicketQuery = {}): Ticket[] {
  const filtered = store.tickets.filter((t) => matches(t, q));
  return [...filtered].sort((a, b) => {
    if (q.sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (q.sort === "priority") {
      return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getTicket(id: string): Ticket | undefined {
  return store.tickets.find((t) => t.id === id);
}

export function listMessages(ticketId: string): Message[] {
  return store.messages
    .filter((m) => m.ticketId === ticketId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function listActivity(ticketId: string): ActivityEvent[] {
  return store.activity
    .filter((a) => a.ticketId === ticketId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export interface CreateTicketBody {
  subject: string;
  description: string;
  categoryId: string;
  departmentId: string;
  priority?: TicketPriority;
  tags?: string[];
  requesterName?: string;
  requesterEmail?: string;
}

export function createTicket(body: CreateTicketBody): Ticket {
  const now = new Date().toISOString();
  const ticket: Ticket = {
    id: nextTicketId(),
    subject: body.subject,
    description: body.description,
    status: "submitted",
    priority: body.priority ?? "medium",
    categoryId: body.categoryId,
    departmentId: body.departmentId,
    tags: body.tags ?? [],
    requester:
      body.requesterName || body.requesterEmail
        ? {
            id: "ext-requester",
            name: body.requesterName ?? "External Requester",
            email: body.requesterEmail ?? "unknown@example.com",
          }
        : CURRENT_CUSTOMER,
    attachmentIds: [],
    messageCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  store.tickets.unshift(ticket);
  store.messages.push({
    id: nextMessageId(),
    ticketId: ticket.id,
    author: { id: ticket.requester.id, name: ticket.requester.name, role: "customer" },
    body: body.description,
    attachmentIds: [],
    createdAt: now,
  });
  store.activity.push({
    id: nextActivityId(),
    ticketId: ticket.id,
    type: "created",
    actor: { id: ticket.requester.id, name: ticket.requester.name, role: "customer" },
    createdAt: now,
  });

  return ticket;
}

export interface UpdateTicketBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
  actorName?: string;
}

export function updateTicket(id: string, body: UpdateTicketBody): Ticket | undefined {
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return undefined;

  const now = new Date().toISOString();
  const actor = {
    id: "automation",
    name: body.actorName ?? "Automation",
    role: "system" as const,
  };

  if (body.status && body.status !== ticket.status) {
    store.activity.push({
      id: nextActivityId(),
      ticketId: id,
      type: "status_changed",
      actor,
      fromValue: ticket.status,
      toValue: body.status,
      createdAt: now,
    });
    ticket.status = body.status;
    if (body.status === "resolved" || body.status === "closed") {
      ticket.resolvedAt = ticket.resolvedAt ?? now;
    }
  }

  if (body.priority && body.priority !== ticket.priority) {
    store.activity.push({
      id: nextActivityId(),
      ticketId: id,
      type: "priority_changed",
      actor,
      fromValue: ticket.priority,
      toValue: body.priority,
      createdAt: now,
    });
    ticket.priority = body.priority;
  }

  if (body.assignedAgentId && body.assignedAgentId !== ticket.assignedAgentId) {
    const agent = getAgentById(body.assignedAgentId);
    store.activity.push({
      id: nextActivityId(),
      ticketId: id,
      type: "assigned",
      actor,
      toValue: agent?.name ?? body.assignedAgentId,
      createdAt: now,
    });
    ticket.assignedAgentId = body.assignedAgentId;
  }

  ticket.updatedAt = now;
  return ticket;
}

export interface AddMessageBody {
  body: string;
  authorRole?: MessageAuthorRole;
  authorName?: string;
}

export function addMessage(ticketId: string, input: AddMessageBody): Message | undefined {
  const ticket = store.tickets.find((t) => t.id === ticketId);
  if (!ticket) return undefined;

  const now = new Date().toISOString();
  const role = input.authorRole ?? "customer";
  const author =
    role === "customer"
      ? { id: ticket.requester.id, name: input.authorName ?? ticket.requester.name, role }
      : { id: "automation", name: input.authorName ?? "Automation", role };

  const message: Message = {
    id: nextMessageId(),
    ticketId,
    author,
    body: input.body,
    attachmentIds: [],
    createdAt: now,
  };

  store.messages.push(message);
  ticket.updatedAt = now;
  ticket.messageCount += 1;
  if (role === "customer" && ticket.status === "awaiting_customer") {
    ticket.status = "in_progress";
  }
  if (role === "agent" && !ticket.firstResponseAt) {
    ticket.firstResponseAt = now;
  }

  return message;
}

// ---------------------------------------------------------------------------
// Dashboard stats (moved from the former client-side lib/api/dashboard.ts)
// ---------------------------------------------------------------------------

const SMOOTHING_WINDOW_DAYS = 3;

function buildVolumeTrend(days: number): TicketVolumePoint[] {
  const now = Date.now();
  const lookback = days + SMOOTHING_WINDOW_DAYS - 1;
  const daily: { date: string; opened: number; resolved: number }[] = [];

  for (let i = lookback - 1; i >= 0; i--) {
    const dayKey = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    const opened = store.tickets.filter((t) => t.createdAt.slice(0, 10) === dayKey).length;
    const resolved = store.tickets.filter(
      (t) => t.resolvedAt && t.resolvedAt.slice(0, 10) === dayKey
    ).length;
    daily.push({ date: dayKey, opened, resolved });
  }

  const smoothed: TicketVolumePoint[] = [];
  for (let i = daily.length - days; i < daily.length; i++) {
    const window = daily.slice(Math.max(0, i - SMOOTHING_WINDOW_DAYS + 1), i + 1);
    smoothed.push({
      date: daily[i].date,
      opened: Math.round((window.reduce((s, d) => s + d.opened, 0) / window.length) * 10) / 10,
      resolved: Math.round((window.reduce((s, d) => s + d.resolved, 0) / window.length) * 10) / 10,
    });
  }
  return smoothed;
}

export function getDashboardStats(): DashboardStats {
  const openCount = store.tickets.filter((t) =>
    ["submitted", "assigned", "in_progress"].includes(t.status)
  ).length;
  const pendingCount = store.tickets.filter((t) => t.status === "awaiting_customer").length;
  const resolvedCount = store.tickets.filter((t) =>
    ["resolved", "closed"].includes(t.status)
  ).length;

  const responseTimes = store.tickets
    .filter((t) => t.firstResponseAt)
    .map(
      (t) =>
        (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / 3_600_000
    );
  const avgResponseTimeHours = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const resolutionTimes = store.tickets
    .filter((t) => t.resolvedAt)
    .map((t) => (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 3_600_000);
  const avgResolutionTimeHours = resolutionTimes.length
    ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
    : 0;

  const ratings = store.tickets
    .filter((t) => typeof t.satisfactionRating === "number")
    .map((t) => t.satisfactionRating as number);
  const satisfactionScore = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length / 5) * 100)
    : 0;

  return {
    openCount,
    pendingCount,
    resolvedCount,
    avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
    avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
    satisfactionScore,
    ticketVolumeTrend: buildVolumeTrend(30),
  };
}

export function findDuplicates(subject: string, description: string) {
  const tokenize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

  const queryTokens = tokenize(`${subject} ${description}`);
  if (queryTokens.size === 0) return [];

  return store.tickets
    .map((ticket) => {
      const ticketTokens = tokenize(ticket.subject);
      let overlap = 0;
      for (const token of ticketTokens) if (queryTokens.has(token)) overlap += 1;
      const score = overlap / Math.max(3, ticketTokens.size);
      return { ticketId: ticket.id, subject: ticket.subject, status: ticket.status, score };
    })
    .filter((m) => m.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
