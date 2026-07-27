import { useQuery } from "@tanstack/react-query";
import { getTickets, type TicketListFilters } from "@/lib/api/tickets";
import { queryKeys } from "./keys";

export function useTickets(filters: TicketListFilters) {
  return useQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: () => getTickets(filters),
  });
}
