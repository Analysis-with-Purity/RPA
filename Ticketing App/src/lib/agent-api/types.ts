/**
 * Wire types for the Support Desk API. These mirror the server's DTOs
 * (`src/domain/ticket.ts`, `src/services/*.ts`) field for field.
 */

import type {
  Channel,
  Priority,
  PurchaseChannel,
  RefundStatus,
  Role,
  TicketStatus,
} from "./catalog";

export interface SlaState {
  firstResponseDue: string | null;
  firstResponseAt: string | null;
  firstResponseBreached: boolean;
  resolutionDue: string | null;
  resolvedAt: string | null;
  resolutionBreached: boolean;
  /** Minutes until the resolution deadline. Negative once overdue. */
  minutesToResolutionDue: number | null;
  anyBreach: boolean;
}

export interface TicketDto {
  ticketId: string;
  ticketNumber: string | null;
  recordId: string;
  status: TicketStatus;
  subject: string;
  description: string;
  priority: Priority | null;
  category: string | null;
  subcategory: string | null;
  channel: Channel | null;
  createdDate: string | null;
  ingestedAt: string | null;
  sourceSystem: string | null;
  attachmentReferences: string[];

  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
    organization: string | null;
    department: string | null;
  };

  commerce: {
    orderNumber: string | null;
    productSku: string | null;
    productName: string | null;
    batchCode: string | null;
    purchaseChannel: PurchaseChannel | null;
  };

  assignment: {
    agent: string | null;
    agentEmail: string | null;
    assignedDate: string | null;
    group: string | null;
  };

  resolution: {
    resolutionNotes: string | null;
    resolutionDate: string | null;
    closedDate: string | null;
    csatScore: number | null;
  };

  refund: {
    status: RefundStatus | null;
    amount: number | null;
  };

  sla: SlaState & { escalationLevel: number; storedBreachFlag: boolean };

  intelligence: {
    aiCategory: string | null;
    aiConfidence: number | null;
    sentimentScore: number | null;
    sentimentLabel: string | null;
    recommendedAgent: string | null;
  };

  audit: {
    workflowInstanceId: string | null;
    queueItemReference: string | null;
    processingAttempts: number | null;
    lastErrorDetails: string | null;
    createTime: string | null;
    updateTime: string | null;
  };
}

export interface CommentDto {
  id: string;
  ticketId: string;
  authorType: "Customer" | "Agent" | "System";
  author: string;
  authorEmail: string | null;
  body: string;
  isInternal: boolean;
  channel: Channel | null;
  attachmentReferences: string[];
  postedAt: string | null;
}

export interface CommentsResponse {
  ticketId: string;
  total: number;
  items: CommentDto[];
}

export interface TicketSearchResult {
  total: number;
  limit: number;
  offset: number;
  items: TicketDto[];
}

export interface TransitionsResponse {
  ticketId: string;
  currentStatus: TicketStatus;
  allowedStatuses: TicketStatus[];
}

// ------------------------------------------------------------------------ search

/** Query accepted by `GET /api/agent/tickets`. Mirrors `TicketSearchSchema`. */
export interface TicketSearchQuery {
  status?: TicketStatus[];
  priority?: Priority;
  category?: string;
  subcategory?: string;
  assignedAgentEmail?: string;
  assignmentGroup?: string;
  customerEmail?: string;
  organization?: string;
  orderNumber?: string;
  batchCode?: string;
  productSku?: string;
  refundStatus?: RefundStatus;
  /** Collapses the four active statuses. Overrides `status` server-side. */
  openOnly?: boolean;
  breachedOnly?: boolean;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
  sortBy?: "CreatedDate" | "IngestedAt" | "Priority" | "Status" | "ResolutionDueDate";
  sortDesc?: boolean;
}

export const SORT_FIELDS = [
  { value: "CreatedDate", label: "Created" },
  { value: "IngestedAt", label: "Ingested" },
  { value: "Priority", label: "Priority" },
  { value: "Status", label: "Status" },
  { value: "ResolutionDueDate", label: "Resolution due" },
] as const;

// ----------------------------------------------------------------- agent actions

export interface AssignInput {
  agentName: string;
  agentEmail: string;
  assignmentGroup?: string;
  note?: string;
}

export interface StatusChangeInput {
  status: TicketStatus;
  note?: string;
}

export interface ResolveInput {
  resolutionNotes: string;
  /** Posted to the customer as a visible reply when supplied. */
  customerReply?: string;
}

export interface CloseInput {
  note?: string;
  csatScore?: number;
}

export interface EscalateInput {
  reason: string;
  /** Absolute level. Omit to increment by one. */
  level?: number;
  raisePriorityTo?: Priority;
  assignmentGroup?: string;
}

export interface UpdateTicketInput {
  priority?: Priority;
  category?: string;
  subcategory?: string;
  orderNumber?: string;
  productSku?: string;
  productName?: string;
  batchCode?: string;
  purchaseChannel?: PurchaseChannel;
  organization?: string;
  department?: string;
  customerName?: string;
  customerPhone?: string;
  assignmentGroup?: string;
}

export interface AddCommentInput {
  body: string;
  authorType: "Customer" | "Agent" | "System";
  author: string;
  authorEmail?: string;
  isInternal?: boolean;
  channel?: Channel;
  attachmentReferences?: string[];
}

export interface RefundRequestInput {
  amount: number;
  reason: string;
}

export interface RefundDecisionInput {
  decision: "Approved" | "Rejected";
  /** Allows approving a different amount than requested. */
  amount?: number;
  note?: string;
}

export interface RefundSettleInput {
  reference?: string;
  note?: string;
}

// ---------------------------------------------------------------------- metrics

export interface SummaryMetrics {
  generatedAt: string;
  totalTickets: number;
  sampled: number;
  /** True when `sampled < totalTickets` — the figures below cover the sample only. */
  truncated: boolean;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byAssignmentGroup: Record<string, number>;
  open: number;
  unassigned: number;
  breached: number;
  refunds: {
    requested: number;
    approved: number;
    processed: number;
    rejected: number;
    totalApprovedValue: number;
  };
  csat: { responses: number; average: number | null };
}

export interface SlaReport {
  generatedAt: string;
  sampled: number;
  truncated: boolean;
  openTickets: number;
  firstResponseBreached: number;
  resolutionBreached: number;
  dueWithin2Hours: number;
  noSlaApplied: number;
  worstOffenders: Array<{
    ticketId: string;
    priority: string | null;
    status: string;
    category: string | null;
    minutesOverdue: number;
    assignedAgentEmail: string | null;
  }>;
}

export interface AgentWorkload {
  generatedAt: string;
  sampled: number;
  agents: Array<{
    agentEmail: string;
    agentName: string | null;
    open: number;
    breached: number;
    byStatus: Record<string, number>;
  }>;
  unassigned: number;
}

export interface BatchReport {
  generatedAt: string;
  sampled: number;
  batches: Array<{
    batchCode: string;
    total: number;
    productNames: string[];
    categories: string[];
    safetyReports: number;
    authenticityReports: number;
    openTickets: number;
  }>;
}

export interface IntakeHealth {
  generatedAt: string;
  totalFailures: number;
  unresolved: number;
  byReason: Record<string, number>;
  byType: Record<string, number>;
}

// ------------------------------------------------------------------- exceptions

export interface ExceptionDto {
  id: string;
  ticketId: string | null;
  ticketNumber: string | null;
  exceptionType: string;
  exceptionReason: string;
  errorMessage: string | null;
  stackTrace: string | null;
  rawPayload: Record<string, unknown> | null;
  rawPayloadText: string | null;
  workflowInstanceId: string | null;
  queueItemReference: string | null;
  occurredAt: string | null;
  retryCount: number;
  notifiedAdmin: boolean;
  resolved: boolean;
  resolvedAt: string | null;
  sourceSystem: string | null;
  /** True when the captured payload holds enough to be re-queued. */
  replayable: boolean;
}

export interface ExceptionSearchQuery {
  resolved?: boolean;
  exceptionType?: "Business" | "System";
  exceptionReason?: string;
  limit?: number;
  offset?: number;
}

export interface ExceptionSearchResult {
  total: number;
  limit: number;
  offset: number;
  items: ExceptionDto[];
}

export interface ReplayResult {
  exceptionId: string;
  ticketId: string;
  queueItemId: number;
}

// ------------------------------------------------------------------------ auth

export interface DevTokenInput {
  subject: string;
  name?: string;
  roles: Role[];
}

export interface DevTokenResponse {
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: number;
  roles: Role[];
}

// ----------------------------------------------------------------------- health

export interface HealthResponse {
  status: string;
  service: string;
  brand: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface UpstreamHealthResponse {
  status: "ready" | "degraded";
  token: unknown;
  endpoints: { orchestrator: string; dataFabric: string };
  checks: Record<string, { ok: boolean; detail?: string; ms?: number }>;
  hint?: string;
}
