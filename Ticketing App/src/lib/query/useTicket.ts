import { useQuery } from "@tanstack/react-query";
import { getTicketById } from "@/lib/api/tickets";
import { queryKeys } from "./keys";

export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => getTicketById(id),
  });
}
