import { ok, error, preflight } from "@/lib/server/http";
import { getTicket, listActivity } from "@/lib/server/ticket-repository";
import { DataFabricError } from "@/lib/server/data-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

/**
 * Status history + automation activity log, sourced from the TicketAudit entity — the same
 * rows the RPA workflows write. Nothing here is reconstructed client-side.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await params;

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return error(`Ticket "${ticketId}" not found.`, 404);

    const activity = await listActivity(ticketId);
    return ok({ activity, total: activity.length });
  } catch (err) {
    if (err instanceof DataFabricError) return error(err.message, 502);
    return error(err instanceof Error ? err.message : "Unexpected error.", 500);
  }
}
