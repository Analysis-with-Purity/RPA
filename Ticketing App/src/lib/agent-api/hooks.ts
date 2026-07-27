"use client";

/**
 * TanStack Query bindings for the Support Desk API.
 *
 * Reads are gated on a token so nothing fires before sign-in resolves. Writes invalidate the
 * ticket detail, its thread and its transitions together — every agent action can change all
 * three (a status change appends a system comment and re-opens a different set of moves).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DeskApiError } from "./client";
import { agentKeys } from "./keys";
import * as api from "./endpoints";
import { useAgentSession, useAgentToken } from "./session";
import type {
  AddCommentInput,
  AssignInput,
  CloseInput,
  EscalateInput,
  ExceptionSearchQuery,
  RefundDecisionInput,
  RefundRequestInput,
  RefundSettleInput,
  ResolveInput,
  StatusChangeInput,
  TicketSearchQuery,
  UpdateTicketInput,
} from "./types";

/** Metrics are aggregated over a 1000-row window server-side; refetching hard is pointless. */
const METRICS_STALE_MS = 60_000;

// ----------------------------------------------------------------------- reads

export function useDeskConfig() {
  return useQuery({
    queryKey: agentKeys.config,
    queryFn: api.getDeskConfig,
    staleTime: 10 * 60_000,
  });
}

export function useTicketSearch(query: TicketSearchQuery) {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.tickets.list(query),
    queryFn: () => api.searchTickets(token, query),
    enabled: !!token,
    // Keeps the previous page on screen while the next one loads instead of flashing empty.
    placeholderData: (prev) => prev,
  });
}

export function useTicket(ticketId: string) {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.tickets.detail(ticketId),
    queryFn: () => api.getTicket(token, ticketId),
    enabled: !!token && !!ticketId,
  });
}

export function useTicketComments(ticketId: string) {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.tickets.comments(ticketId),
    queryFn: () => api.getComments(token, ticketId),
    enabled: !!token && !!ticketId,
  });
}

export function useTicketTransitions(ticketId: string) {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.tickets.transitions(ticketId),
    queryFn: () => api.getTransitions(token, ticketId),
    enabled: !!token && !!ticketId,
  });
}

export function useSummaryMetrics(since?: string) {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.metrics.summary(since),
    queryFn: () => api.getSummary(token, since),
    enabled: !!token,
    staleTime: METRICS_STALE_MS,
  });
}

export function useSlaReport() {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.metrics.sla,
    queryFn: () => api.getSlaReport(token),
    enabled: !!token,
    staleTime: METRICS_STALE_MS,
  });
}

export function useAgentWorkload() {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.metrics.workload,
    queryFn: () => api.getWorkload(token),
    enabled: !!token,
    staleTime: METRICS_STALE_MS,
  });
}

export function useBatchReport() {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.metrics.batches,
    queryFn: () => api.getBatchReport(token),
    enabled: !!token,
    staleTime: METRICS_STALE_MS,
  });
}

export function useIntakeHealth() {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.metrics.intakeHealth,
    queryFn: () => api.getIntakeHealth(token),
    enabled: !!token,
    staleTime: METRICS_STALE_MS,
  });
}

export function useExceptions(query: ExceptionSearchQuery, enabled = true) {
  const token = useAgentToken();
  return useQuery({
    queryKey: agentKeys.exceptions.list(query),
    queryFn: () => api.searchExceptions(token, query),
    enabled: !!token && enabled,
    placeholderData: (prev) => prev,
  });
}

// -------------------------------------------------------------------- mutations

function errorMessage(err: unknown): string {
  if (err instanceof DeskApiError) {
    const fields = err.fieldErrors;
    if (fields.length) {
      return `${err.message} (${fields.map((f) => `${f.field}: ${f.message}`).join("; ")})`;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

/**
 * Shared plumbing for every ticket write: refresh the three ticket-scoped queries plus any
 * open list, then toast the outcome.
 */
function useTicketMutation<TInput>(
  ticketId: string,
  mutationFn: (token: string | null, input: TInput) => Promise<unknown>,
  successMessage: string | ((input: TInput) => string),
) {
  const token = useAgentToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TInput) => mutationFn(token, input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.tickets.comments(ticketId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.tickets.transitions(ticketId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.tickets.all });
      // Counts on the dashboard move with almost every action.
      queryClient.invalidateQueries({ queryKey: agentKeys.metrics.all });
      toast.success(
        typeof successMessage === "function" ? successMessage(input) : successMessage,
      );
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useClaimTicket(ticketId: string) {
  return useTicketMutation<void>(
    ticketId,
    (token) => api.claimTicket(token, ticketId),
    "Ticket claimed.",
  );
}

export function useAssignTicket(ticketId: string) {
  return useTicketMutation<AssignInput>(
    ticketId,
    (token, input) => api.assignTicket(token, ticketId, input),
    (input) => `Assigned to ${input.agentName}.`,
  );
}

export function useChangeStatus(ticketId: string) {
  return useTicketMutation<StatusChangeInput>(
    ticketId,
    (token, input) => api.changeStatus(token, ticketId, input),
    (input) => `Status changed to ${input.status}.`,
  );
}

export function useResolveTicket(ticketId: string) {
  return useTicketMutation<ResolveInput>(
    ticketId,
    (token, input) => api.resolveTicket(token, ticketId, input),
    "Ticket resolved.",
  );
}

export function useCloseTicket(ticketId: string) {
  return useTicketMutation<CloseInput>(
    ticketId,
    (token, input) => api.closeTicket(token, ticketId, input),
    "Ticket closed.",
  );
}

export function useEscalateTicket(ticketId: string) {
  return useTicketMutation<EscalateInput>(
    ticketId,
    (token, input) => api.escalateTicket(token, ticketId, input),
    "Ticket escalated.",
  );
}

export function useUpdateTicket(ticketId: string) {
  return useTicketMutation<UpdateTicketInput>(
    ticketId,
    (token, input) => api.updateTicket(token, ticketId, input),
    "Ticket updated.",
  );
}

export function useAddComment(ticketId: string) {
  return useTicketMutation<AddCommentInput>(
    ticketId,
    (token, input) => api.addComment(token, ticketId, input),
    (input) => (input.isInternal ? "Internal note added." : "Reply sent to customer."),
  );
}

export function useRequestRefund(ticketId: string) {
  return useTicketMutation<RefundRequestInput>(
    ticketId,
    (token, input) => api.requestRefund(token, ticketId, input),
    "Refund requested.",
  );
}

export function useDecideRefund(ticketId: string) {
  return useTicketMutation<RefundDecisionInput>(
    ticketId,
    (token, input) => api.decideRefund(token, ticketId, input),
    (input) => `Refund ${input.decision.toLowerCase()}.`,
  );
}

export function useSettleRefund(ticketId: string) {
  return useTicketMutation<RefundSettleInput>(
    ticketId,
    (token, input) => api.settleRefund(token, ticketId, input),
    "Refund marked as processed.",
  );
}

// ------------------------------------------------------------ exception actions

export function useReplayException() {
  const token = useAgentToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.replayException(token, id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.exceptions.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.metrics.intakeHealth });
      toast.success(`Re-queued ${result.ticketId} (queue item ${result.queueItemId}).`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useResolveException() {
  const token = useAgentToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      api.resolveException(token, id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.exceptions.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.metrics.intakeHealth });
      toast.success("Exception marked resolved.");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** Re-exported so pages can gate supervisor-only controls without a second import. */
export { useAgentSession, useAgentToken };
export { errorMessage as deskErrorMessage };
