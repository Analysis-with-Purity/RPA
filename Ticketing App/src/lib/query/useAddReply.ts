import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Message } from "@/lib/types";
import { addMessage } from "@/lib/api/tickets";
import { CURRENT_CUSTOMER } from "@/lib/mock-data/customer";
import { queryKeys } from "./keys";

const PENDING_ID_PREFIX = "pending-";

export function useAddReply(ticketId: string) {
  const queryClient = useQueryClient();
  const messagesKey = queryKeys.tickets.messages(ticketId);

  return useMutation({
    mutationFn: (body: string) => addMessage(ticketId, body),
    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      const previous = queryClient.getQueryData<Message[]>(messagesKey);

      const optimisticMessage: Message = {
        id: `${PENDING_ID_PREFIX}${Date.now()}`,
        ticketId,
        author: { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" },
        body,
        attachmentIds: [],
        createdAt: new Date().toISOString(),
        pending: true,
      };

      queryClient.setQueryData<Message[]>(messagesKey, (old) => [
        ...(old ?? []),
        optimisticMessage,
      ]);

      return { previous, optimisticId: optimisticMessage.id };
    },
    onError: (error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
      toast.error("Reply failed to send", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.activity(ticketId) });
    },
  });
}
