import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTicket } from "@/lib/api/tickets";
import { queryKeys } from "./keys";

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
      toast.success(`Ticket ${ticket.id} created`, {
        description: "We'll notify you here as soon as an agent responds.",
      });
    },
    onError: (error) => {
      toast.error("Couldn't create your ticket", {
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });
}
