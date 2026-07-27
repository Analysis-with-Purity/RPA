import { ok, error, preflight, readJson } from "@/lib/server/http";
import { getTicket } from "@/lib/server/ticket-repository";
import { DataFabricError } from "@/lib/server/data-fabric";
import { queueTriage } from "@/lib/server/orchestration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

/**
 * The START PROCESS / TRIAGE TICKET action behind the button on every ticket.
 *
 * Hands the ticket to the Maestro BPMN process by way of Q_TicketIntake. Maestro validates,
 * triages, branches on priority, invokes the assignment workflow and drives the status
 * write-back — none of which happens here. The API's only job is to raise the request.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;
  const body = (await readJson<{ requestedBy?: string }>(request)) ?? {};

  let ticket;
  try {
    ticket = await getTicket(ticketId);
  } catch (err) {
    if (err instanceof DataFabricError) return error(err.message, 502);
    return error(err instanceof Error ? err.message : "Unexpected error.", 500);
  }
  if (!ticket) return error(`Ticket "${ticketId}" not found.`, 404);

  // Re-triaging a finished ticket would reopen it behind the user's back.
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return error(
      `Ticket "${ticketId}" is ${ticket.status}. Reopen it before starting the process again.`,
      409,
    );
  }

  const result = await queueTriage(ticketId, {
    priority: ticket.priority,
    requestedBy: body.requestedBy?.trim() || "CodedApp",
  });

  if (!result.queued) {
    return error(`Could not start the process: ${result.error ?? "unknown error"}`, 502);
  }

  return ok(
    {
      ticketId,
      started: true,
      queue: result.queue,
      reference: result.reference,
      queueItemId: result.queueItemId,
      currentStatus: ticket.status,
      note: "Maestro will pick this up. Poll GET /api/v1/tickets/{id} to watch the status advance.",
    },
    202,
  );
}
