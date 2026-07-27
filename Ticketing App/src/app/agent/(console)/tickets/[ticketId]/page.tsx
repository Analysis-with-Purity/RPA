import { TicketWorkspace } from "@/components/agent/ticket/TicketWorkspace";

/**
 * Next 16 removed synchronous access to route params — they arrive as a Promise and must
 * be awaited before use.
 */
export default async function AgentTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  return <TicketWorkspace ticketId={decodeURIComponent(ticketId)} />;
}
