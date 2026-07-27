/**
 * One function per Support Desk API route the console uses.
 *
 * Every back-office call takes the agent token explicitly rather than reading it from a
 * module-level singleton, so a request can never quietly go out unauthenticated.
 */

import { deskFetch } from "./client";
import type { DeskConfig } from "./catalog";
import type {
  AddCommentInput,
  AgentWorkload,
  AssignInput,
  BatchReport,
  CloseInput,
  CommentDto,
  CommentsResponse,
  EscalateInput,
  ExceptionDto,
  ExceptionSearchQuery,
  ExceptionSearchResult,
  HealthResponse,
  IntakeHealth,
  RefundDecisionInput,
  RefundRequestInput,
  RefundSettleInput,
  ReplayResult,
  ResolveInput,
  SlaReport,
  StatusChangeInput,
  SummaryMetrics,
  TicketDto,
  TicketSearchQuery,
  TicketSearchResult,
  TransitionsResponse,
  UpdateTicketInput,
  UpstreamHealthResponse,
} from "./types";

type Token = string | null | undefined;

// -------------------------------------------------------------------- unauthed

export const getDeskConfig = () => deskFetch<DeskConfig>("/api/config");

export const getHealth = () => deskFetch<HealthResponse>("/api/health");

export const getUpstreamHealth = () =>
  deskFetch<UpstreamHealthResponse>("/api/health/upstream");

// --------------------------------------------------------------------- tickets

export const searchTickets = (token: Token, query: TicketSearchQuery) =>
  deskFetch<TicketSearchResult>("/api/agent/tickets", { token, query });

export const getTicket = (token: Token, ticketId: string) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}`, { token });

/** Full thread — unlike the public route, this includes internal notes. */
export const getComments = (token: Token, ticketId: string) =>
  deskFetch<CommentsResponse>(
    `/api/agent/tickets/${encodeURIComponent(ticketId)}/comments`,
    { token },
  );

export const getTransitions = (token: Token, ticketId: string) =>
  deskFetch<TransitionsResponse>(
    `/api/agent/tickets/${encodeURIComponent(ticketId)}/transitions`,
    { token },
  );

export const updateTicket = (token: Token, ticketId: string, body: UpdateTicketInput) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}`, {
    method: "PATCH",
    token,
    body,
  });

export const assignTicket = (token: Token, ticketId: string, body: AssignInput) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}/assign`, {
    method: "POST",
    token,
    body,
  });

/** Self-assign. The server fills in the acting agent from the token. */
export const claimTicket = (token: Token, ticketId: string) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}/claim`, {
    method: "POST",
    token,
    body: {},
  });

export const changeStatus = (token: Token, ticketId: string, body: StatusChangeInput) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: "POST",
    token,
    body,
  });

export const resolveTicket = (token: Token, ticketId: string, body: ResolveInput) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}/resolve`, {
    method: "POST",
    token,
    body,
  });

export const closeTicket = (token: Token, ticketId: string, body: CloseInput) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}/close`, {
    method: "POST",
    token,
    body,
  });

/** Supervisor only. */
export const escalateTicket = (token: Token, ticketId: string, body: EscalateInput) =>
  deskFetch<TicketDto>(`/api/agent/tickets/${encodeURIComponent(ticketId)}/escalate`, {
    method: "POST",
    token,
    body,
  });

export const addComment = (token: Token, ticketId: string, body: AddCommentInput) =>
  deskFetch<{ ticketId: string; comment: CommentDto }>(
    `/api/agent/tickets/${encodeURIComponent(ticketId)}/comments`,
    { method: "POST", token, body },
  );

// --------------------------------------------------------------------- refunds

export const requestRefund = (token: Token, ticketId: string, body: RefundRequestInput) =>
  deskFetch<TicketDto>(
    `/api/agent/tickets/${encodeURIComponent(ticketId)}/refund/request`,
    { method: "POST", token, body },
  );

/** Supervisor only — approving money is not an agent decision. */
export const decideRefund = (token: Token, ticketId: string, body: RefundDecisionInput) =>
  deskFetch<TicketDto>(
    `/api/agent/tickets/${encodeURIComponent(ticketId)}/refund/decision`,
    { method: "POST", token, body },
  );

/** Supervisor only. */
export const settleRefund = (token: Token, ticketId: string, body: RefundSettleInput) =>
  deskFetch<TicketDto>(
    `/api/agent/tickets/${encodeURIComponent(ticketId)}/refund/settle`,
    { method: "POST", token, body },
  );

// --------------------------------------------------------------------- metrics

export const getSummary = (token: Token, since?: string) =>
  deskFetch<SummaryMetrics>("/api/metrics/summary", { token, query: { since } });

export const getSlaReport = (token: Token) =>
  deskFetch<SlaReport>("/api/metrics/sla", { token });

export const getWorkload = (token: Token) =>
  deskFetch<AgentWorkload>("/api/metrics/workload", { token });

export const getBatchReport = (token: Token) =>
  deskFetch<BatchReport>("/api/metrics/batches", { token });

export const getIntakeHealth = (token: Token) =>
  deskFetch<IntakeHealth>("/api/metrics/intake-health", { token });

// ------------------------------------------------------------------ exceptions

/** All exception routes are supervisor-gated server-side. */
export const searchExceptions = (token: Token, query: ExceptionSearchQuery) =>
  deskFetch<ExceptionSearchResult>("/api/intake-exceptions", { token, query });

export const getException = (token: Token, id: string) =>
  deskFetch<ExceptionDto>(`/api/intake-exceptions/${encodeURIComponent(id)}`, { token });

export const replayException = (token: Token, id: string) =>
  deskFetch<ReplayResult>(`/api/intake-exceptions/${encodeURIComponent(id)}/replay`, {
    method: "POST",
    token,
    body: {},
  });

export const resolveException = (token: Token, id: string, note?: string) =>
  deskFetch<ExceptionDto>(`/api/intake-exceptions/${encodeURIComponent(id)}/resolve`, {
    method: "POST",
    token,
    body: note ? { note } : {},
  });
