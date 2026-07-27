import type { DfRecord } from '../uipath/dataFabric.js';
import { evaluateSla, type SlaState } from './sla.js';
import type { TicketStatus } from '../config/catalog.js';

/**
 * Wire shape for a ticket. Deliberately camelCase and grouped — the raw Data Fabric record
 * is flat PascalCase with 48 columns, most of which a website or agent console should not
 * have to reason about.
 */
export interface TicketDto {
  ticketId: string;
  ticketNumber: string | null;
  recordId: string;
  status: TicketStatus;
  subject: string;
  description: string;
  priority: string | null;
  category: string | null;
  subcategory: string | null;
  channel: string | null;
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
    purchaseChannel: string | null;
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
    status: string | null;
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

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s === '' ? null : s;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

/** `AttachmentReferences` is stored as a JSON array in a text column. */
function parseAttachments(v: unknown): string[] {
  const raw = str(v);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    // Older rows may hold a bare URL or a comma-separated list.
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function serializeAttachments(urls: string[] | undefined): string | undefined {
  if (!urls || urls.length === 0) return undefined;
  return JSON.stringify(urls);
}

export function toTicketDto(r: DfRecord, now: Date = new Date()): TicketDto {
  const slaState = evaluateSla(
    {
      FirstResponseDueDate: str(r.FirstResponseDueDate),
      FirstResponseDate: str(r.FirstResponseDate),
      ResolutionDueDate: str(r.ResolutionDueDate),
      ResolutionDate: str(r.ResolutionDate),
      Status: str(r.Status),
    },
    now,
  );

  return {
    ticketId: String(r.TicketId ?? ''),
    ticketNumber: str(r.TicketNumber),
    recordId: String(r.Id ?? ''),
    status: (str(r.Status) ?? 'Not Assigned') as TicketStatus,
    subject: String(r.Subject ?? ''),
    description: String(r.Description ?? ''),
    priority: str(r.Priority),
    category: str(r.Category),
    subcategory: str(r.Subcategory),
    channel: str(r.Channel),
    createdDate: str(r.CreatedDate),
    ingestedAt: str(r.IngestedAt),
    sourceSystem: str(r.SourceSystem),
    attachmentReferences: parseAttachments(r.AttachmentReferences),

    customer: {
      name: str(r.CustomerName),
      email: str(r.CustomerEmail),
      phone: str(r.CustomerPhone),
      organization: str(r.Organization),
      department: str(r.Department),
    },

    commerce: {
      orderNumber: str(r.OrderNumber),
      productSku: str(r.ProductSku),
      productName: str(r.ProductName),
      batchCode: str(r.BatchCode),
      purchaseChannel: str(r.PurchaseChannel),
    },

    assignment: {
      agent: str(r.AssignedAgent),
      agentEmail: str(r.AssignedAgentEmail),
      assignedDate: str(r.AssignedDate),
      group: str(r.AssignmentGroup),
    },

    resolution: {
      resolutionNotes: str(r.ResolutionNotes),
      resolutionDate: str(r.ResolutionDate),
      closedDate: str(r.ClosedDate),
      csatScore: num(r.CsatScore),
    },

    refund: {
      status: str(r.RefundStatus),
      amount: num(r.RefundAmount),
    },

    sla: {
      ...slaState,
      escalationLevel: num(r.EscalationLevel) ?? 0,
      storedBreachFlag: bool(r.SlaBreached),
    },

    intelligence: {
      aiCategory: str(r.AiCategory),
      aiConfidence: num(r.AiConfidence),
      sentimentScore: num(r.SentimentScore),
      sentimentLabel: str(r.SentimentLabel),
      recommendedAgent: str(r.RecommendedAgent),
    },

    audit: {
      workflowInstanceId: str(r.WorkflowInstanceId),
      queueItemReference: str(r.QueueItemReference),
      processingAttempts: num(r.ProcessingAttempts),
      lastErrorDetails: str(r.LastErrorDetails),
      createTime: str(r.CreateTime),
      updateTime: str(r.UpdateTime),
    },
  };
}

/**
 * Customer-facing projection. Strips internal notes, audit trail, AI scoring and the
 * assigned agent's email — a customer sees that someone is handling it, not who to chase.
 */
export interface PublicTicketDto {
  ticketId: string;
  ticketNumber: string | null;
  status: TicketStatus;
  subject: string;
  description: string;
  priority: string | null;
  category: string | null;
  subcategory: string | null;
  createdDate: string | null;
  attachmentReferences: string[];
  orderNumber: string | null;
  productName: string | null;
  handledBy: string | null;
  expectedResolutionBy: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  refundStatus: string | null;
  refundAmount: number | null;
}

export function toPublicTicketDto(r: DfRecord, now: Date = new Date()): PublicTicketDto {
  const full = toTicketDto(r, now);
  return {
    ticketId: full.ticketId,
    ticketNumber: full.ticketNumber,
    status: full.status,
    subject: full.subject,
    description: full.description,
    priority: full.priority,
    category: full.category,
    subcategory: full.subcategory,
    createdDate: full.createdDate,
    attachmentReferences: full.attachmentReferences,
    orderNumber: full.commerce.orderNumber,
    productName: full.commerce.productName,
    handledBy: full.assignment.agent,
    expectedResolutionBy: full.sla.resolutionDue,
    resolvedAt: full.resolution.resolutionDate,
    closedAt: full.resolution.closedDate,
    refundStatus: full.refund.status,
    refundAmount: full.refund.amount,
  };
}

export interface CommentDto {
  id: string;
  ticketId: string;
  authorType: string;
  author: string;
  authorEmail: string | null;
  body: string;
  isInternal: boolean;
  channel: string | null;
  attachmentReferences: string[];
  postedAt: string | null;
}

export function toCommentDto(r: DfRecord): CommentDto {
  return {
    id: String(r.Id ?? ''),
    ticketId: String(r.TicketId ?? ''),
    authorType: String(r.AuthorType ?? ''),
    author: String(r.Author ?? ''),
    authorEmail: str(r.AuthorEmail),
    body: String(r.Body ?? ''),
    isInternal: bool(r.IsInternal),
    channel: str(r.Channel),
    attachmentReferences: parseAttachments(r.AttachmentReferences),
    postedAt: str(r.PostedAt) ?? str(r.CreateTime),
  };
}
