import { useQuery } from "@tanstack/react-query";
import { getActivity } from "@/lib/api/tickets";
import { queryKeys } from "./keys";

export function useTicketActivity(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.tickets.activity(ticketId),
    queryFn: () => getActivity(ticketId),
  });
}
