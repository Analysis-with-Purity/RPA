import { ok, error, preflight, readJson } from "@/lib/server/http";
import { getTicket } from "@/lib/server/ticket-repository";
import { DataFabricError } from "@/lib/server/data-fabric";
import {
  queueAssignment,
  queueEscalation,
  queueStatusChange,
  type QueueResult,
} from "@/lib/server/orchestration";
import { getAgentById } from "@/lib/mock-data/agents";
import type { TicketPriority, TicketStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: TicketStatus[] = [
  "submitted",
  "assigned",
  "in_progress",
  "awaiting_customer",
  "resolved",
  "closed",
];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export function OPTIONS() {
  return preflight();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;
  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return error(`Ticket "${ticketId}" not found.`, 404);
    return ok(ticket);
  } catch (err) {
    return upstreamFailure(err);
  }
}

interface CommandBody {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
  escalate?: { reason: string };
  requestedBy?: string;
}

/**
 * Requests a change — it does not make one.
 *
 * The API is forbidden from writing to Data Fabric or updating status directly, so this
 * pushes a command onto the queue that owns the relevant part of the lifecycle and returns
 * 202. The RPA workflow performs the write and the Coded App sees it on the next refresh.
 *
 * This is why the response carries the *current* ticket alongside the queued commands:
 * returning an optimistically-mutated ticket would claim a change that has not happened.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;

  const body = await readJson<CommandBody>(request);
  if (!body) return error("Request body must be valid JSON.");

  if (body.status && !STATUSES.includes(body.status)) {
    return error(`Invalid status "${body.status}". Allowed: ${STATUSES.join(", ")}.`, 422);
  }
  if (body.priority && !PRIORITIES.includes(body.priority)) {
    return error(`Invalid priority "${body.priority}". Allowed: ${PRIORITIES.join(", ")}.`, 422);
  }
  if (body.assignedAgentId && !getAgentById(body.assignedAgentId)) {
    return error(`Unknown assignedAgentId "${body.assignedAgentId}". See GET /api/v1/meta.`, 422);
  }
  if (!body.status && !body.assignedAgentId && !body.escalate) {
    return error("Provide at least one of: status, assignedAgentId, escalate.", 422);
  }

  let ticket;
  try {
    ticket = await getTicket(ticketId);
  } catch (err) {
    return upstreamFailure(err);
  }
  if (!ticket) return error(`Ticket "${ticketId}" not found.`, 404);

  const requestedBy = body.requestedBy?.trim() || "CodedApp";
  const commands: Array<{ intent: string; result: QueueResult }> = [];

  if (body.assignedAgentId) {
    const agent = getAgentById(body.assignedAgentId);
    commands.push({
      intent: "assign",
      result: await queueAssignment(ticketId, agent?.name, requestedBy),
    });
  }
  if (body.status) {
    commands.push({
      intent: "status",
      result: await queueStatusChange(ticketId, body.status, requestedBy),
    });
  }
  if (body.escalate?.reason) {
    commands.push({
      intent: "escalate",
      result: await queueEscalation(ticketId, body.escalate.reason, requestedBy),
    });
  }

  const failed = commands.filter((c) => !c.result.queued);
  if (failed.length > 0) {
    return error(
      `Could not queue ${failed.map((f) => f.intent).join(", ")}: ${failed
        .map((f) => f.result.error ?? "unknown error")
        .join("; ")}`,
      502,
    );
  }

  return ok(
    {
      ticket,
      accepted: commands.map((c) => ({
        intent: c.intent,
        queue: c.result.queue,
        reference: c.result.reference,
        queueItemId: c.result.queueItemId,
      })),
      note: "Commands queued. The ticket reflects current stored state; re-read after the automation runs.",
    },
    202,
  );
}

/** Data Fabric refusing or being unreachable is an upstream fault, not a bad request. */
function upstreamFailure(err: unknown) {
  if (err instanceof DataFabricError) return error(err.message, 502);
  return error(err instanceof Error ? err.message : "Unexpected error.", 500);
}
