import { ok, error, preflight } from "@/lib/server/http";
import { getTicket } from "@/lib/server/ticket-repository";
import { DataFabricError } from "@/lib/server/data-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

/**
 * Conversation thread.
 *
 * The tenant has a `TicketComment` entity, but nothing writes to it for these tickets yet —
 * intake stores the customer's text in the ticket's own Description. So this returns an
 * empty thread rather than a 404: the ticket exists and simply has no replies, which is a
 * different thing from "no such ticket" and the UI renders it as an empty state.
 *
 * Posting is disabled until a workflow owns comment writes — the API is not allowed to write
 * to Data Fabric, so accepting a reply here and dropping it would be worse than refusing it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return error(`Ticket "${ticketId}" not found.`, 404);
    return ok({ messages: [], total: 0 });
  } catch (err) {
    if (err instanceof DataFabricError) return error(err.message, 502);
    return error(err instanceof Error ? err.message : "Unexpected error.", 500);
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;
  return error(
    `Replies are not yet wired for "${ticketId}". Comment writes must go through a workflow — the API cannot write to Data Fabric directly.`,
    501,
  );
}
