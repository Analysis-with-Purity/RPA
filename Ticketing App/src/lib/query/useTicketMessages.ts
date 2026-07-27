import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/lib/api/tickets";
import { queryKeys } from "./keys";

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.tickets.messages(ticketId),
    queryFn: () => getMessages(ticketId),
  });
}
