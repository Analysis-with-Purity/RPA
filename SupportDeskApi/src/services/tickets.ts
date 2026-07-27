import { env } from '../config/env.js';
import {
  OPEN_STATUSES,
  assignmentGroupFor,
  canTransition,
  type Priority,
  type TicketStatus,
} from '../config/catalog.js';
import { planSla } from '../domain/sla.js';
import { toTicketDto, type TicketDto } from '../domain/ticket.js';
import type { TicketSearchInput } from '../domain/schemas.js';
import {
  type DfRecord,
  type FilterGroup,
  type QueryFilter,
  findOneBy,
  queryRecords,
  updateRecord,
} from '../uipath/dataFabric.js';
import { BusinessRuleError, ConflictError, NotFoundError } from '../util/errors.js';
import { logger } from '../util/logger.js';
import { addComment } from './comments.js';

const TICKET = env.ENTITY_TICKET;

// ------------------------------------------------------------------------- reads

export async function findTicketRecord(ticketId: string): Promise<DfRecord | null> {
  return findOneBy<DfRecord>(TICKET, 'TicketId', ticketId);
}

/** Loads a ticket or throws 404. Returns the raw record so callers can update by `Id`. */
export async function requireTicketRecord(ticketId: string): Promise<DfRecord> {
  const record = await findTicketRecord(ticketId);
  if (!record) throw new NotFoundError(`No ticket found with id "${ticketId}".`);
  return record;
}

export async function getTicket(ticketId: string): Promise<TicketDto> {
  return toTicketDto(await requireTicketRecord(ticketId));
}

export interface SearchResult {
  total: number;
  limit: number;
  offset: number;
  items: TicketDto[];
}

export async function searchTickets(q: TicketSearchInput): Promise<SearchResult> {
  const filters: QueryFilter[] = [];
  const groups: FilterGroup[] = [];

  const eq = (fieldName: string, value: string | undefined) => {
    if (value) filters.push({ fieldName, operator: '=', value });
  };

  eq('Priority', q.priority);
  eq('Category', q.category);
  eq('Subcategory', q.subcategory);
  eq('AssignedAgentEmail', q.assignedAgentEmail);
  eq('AssignmentGroup', q.assignmentGroup);
  eq('CustomerEmail', q.customerEmail);
  eq('Organization', q.organization);
  eq('OrderNumber', q.orderNumber);
  eq('BatchCode', q.batchCode);
  eq('ProductSku', q.productSku);
  eq('RefundStatus', q.refundStatus);

  if (q.createdFrom) {
    filters.push({ fieldName: 'CreatedDate', operator: '>=', value: new Date(q.createdFrom).toISOString() });
  }
  if (q.createdTo) {
    filters.push({ fieldName: 'CreatedDate', operator: '<=', value: new Date(q.createdTo).toISOString() });
  }

  // Status is multi-valued, so it becomes an OR sub-group rather than a repeated filter.
  const statuses: TicketStatus[] = q.openOnly ? OPEN_STATUSES : (q.status ?? []);
  if (statuses.length === 1) {
    filters.push({ fieldName: 'Status', operator: '=', value: statuses[0]! });
  } else if (statuses.length > 1) {
    groups.push({
      logicalOperator: 1,
      queryFilters: statuses.map((s) => ({ fieldName: 'Status', operator: '=', value: s })),
    });
  }

  const filterGroup: FilterGroup | undefined =
    filters.length || groups.length
      ? { logicalOperator: 0, queryFilters: filters, ...(groups.length ? { filterGroups: groups } : {}) }
      : undefined;

  // `breachedOnly` is applied after the fetch: breach is a computed comparison against "now",
  // and pushing a moving timestamp into the query would make paging non-deterministic.
  const fetchLimit = q.breachedOnly ? Math.min(q.limit * 4, 200) : q.limit;

  const result = await queryRecords<DfRecord>(TICKET, {
    ...(filterGroup ? { filterGroup } : {}),
    start: q.offset,
    limit: fetchLimit,
    sortOptions: [{ fieldName: q.sortBy, isDescending: q.sortDesc }],
  });

  let items = result.value.map((r) => toTicketDto(r));
  let total = result.totalRecordCount;

  if (q.breachedOnly) {
    items = items.filter((t) => t.sla.anyBreach);
    total = items.length; // count is within the fetched window only
    items = items.slice(0, q.limit);
  }

  return { total, limit: q.limit, offset: q.offset, items };
}

// -------------------------------------------------------------------- lifecycle

function nowIso(): string {
  return new Date().toISOString();
}

async function patch(record: DfRecord, changes: DfRecord): Promise<TicketDto> {
  const updated = await updateRecord(TICKET, { Id: record.Id, ...changes });
  // update-batch echoes the row, but fall back to a re-read if it comes back thin.
  const merged = updated && Object.keys(updated).length > 3 ? updated : { ...record, ...changes };
  return toTicketDto(merged);
}

function assertTransition(record: DfRecord, to: TicketStatus): TicketStatus {
  const from = (String(record.Status ?? 'Not Assigned') as TicketStatus) ?? 'Not Assigned';
  if (from === to) {
    throw new ConflictError(`Ticket is already in status "${to}".`);
  }
  if (!canTransition(from, to)) {
    throw new ConflictError(
      `Cannot move a ticket from "${from}" to "${to}".`,
      { from, to, allowed: [] },
    );
  }
  return from;
}

export interface ActorRef {
  name: string;
  email: string;
}

/**
 * Assignment also starts the SLA clock if intake left it unset. The intake automation
 * deliberately leaves SLA fields null, so this is the first point at which a policy is known
 * to have been applied.
 */
export async function assignTicket(
  ticketId: string,
  input: { agentName: string; agentEmail: string; assignmentGroup?: string; note?: string },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  const from = String(record.Status ?? 'Not Assigned') as TicketStatus;

  if (from === 'Cancelled' || from === 'Closed') {
    throw new ConflictError(`Cannot assign a ${from.toLowerCase()} ticket.`);
  }

  const changes: DfRecord = {
    AssignedAgent: input.agentName,
    AssignedAgentEmail: input.agentEmail,
    AssignedDate: nowIso(),
    AssignmentGroup:
      input.assignmentGroup ?? record.AssignmentGroup ?? assignmentGroupFor(String(record.Category ?? '')),
  };

  if (from === 'Not Assigned') changes.Status = 'Assigned';

  if (!record.ResolutionDueDate) {
    const priority = (String(record.Priority ?? 'Medium') as Priority) ?? 'Medium';
    const created = record.CreatedDate ? new Date(String(record.CreatedDate)) : new Date();
    const sla = planSla(priority, created);
    changes.SlaPolicy = sla.slaPolicy;
    changes.FirstResponseDueDate = sla.firstResponseDueDate;
    changes.ResolutionDueDate = sla.resolutionDueDate;
  }

  const dto = await patch(record, changes);

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: input.note
      ? `Assigned to ${input.agentName} (${input.agentEmail}). ${input.note}`
      : `Assigned to ${input.agentName} (${input.agentEmail}).`,
    isInternal: true,
    channel: 'Web',
  });

  logger.info({ ticketId, agent: input.agentEmail, actor: actor.email }, 'SupportDeskApi | TicketAssigned');
  return dto;
}

export async function changeStatus(
  ticketId: string,
  to: TicketStatus,
  note: string | undefined,
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  const from = assertTransition(record, to);

  const changes: DfRecord = { Status: to };

  // Reopening clears the resolution stamps so SLA and reporting do not treat it as closed.
  if ((from === 'Resolved' || from === 'Closed') && to === 'In Progress') {
    changes.ResolutionDate = null;
    changes.ClosedDate = null;
  }
  if (to === 'Cancelled') changes.ClosedDate = nowIso();

  const dto = await patch(record, changes);

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: note ? `Status ${from} -> ${to}. ${note}` : `Status ${from} -> ${to}.`,
    isInternal: true,
    channel: 'Web',
  });

  logger.info({ ticketId, from, to, actor: actor.email }, 'SupportDeskApi | TicketStatusChanged');
  return dto;
}

export async function resolveTicket(
  ticketId: string,
  input: { resolutionNotes: string; customerReply?: string },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  assertTransition(record, 'Resolved');

  const dto = await patch(record, {
    Status: 'Resolved',
    ResolutionDate: nowIso(),
    ResolutionNotes: input.resolutionNotes,
    ...(record.FirstResponseDate ? {} : { FirstResponseDate: nowIso() }),
  });

  await addComment(ticketId, {
    authorType: 'Agent',
    author: actor.name,
    authorEmail: actor.email,
    body: input.resolutionNotes,
    isInternal: true,
    channel: 'Web',
  });

  if (input.customerReply) {
    await addComment(ticketId, {
      authorType: 'Agent',
      author: actor.name,
      authorEmail: actor.email,
      body: input.customerReply,
      isInternal: false,
      channel: 'Web',
    });
  }

  logger.info({ ticketId, actor: actor.email }, 'SupportDeskApi | TicketResolved');
  return dto;
}

export async function closeTicket(
  ticketId: string,
  input: { note?: string; csatScore?: number },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  assertTransition(record, 'Closed');

  const changes: DfRecord = { Status: 'Closed', ClosedDate: nowIso() };
  if (input.csatScore !== undefined) changes.CsatScore = input.csatScore;
  if (!record.ResolutionDate) changes.ResolutionDate = nowIso();

  const dto = await patch(record, changes);

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: input.note ? `Ticket closed. ${input.note}` : 'Ticket closed.',
    isInternal: true,
    channel: 'Web',
  });

  logger.info({ ticketId, actor: actor.email }, 'SupportDeskApi | TicketClosed');
  return dto;
}

export async function escalateTicket(
  ticketId: string,
  input: { reason: string; level?: number; raisePriorityTo?: Priority; assignmentGroup?: string },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  const status = String(record.Status ?? '') as TicketStatus;
  if (status === 'Closed' || status === 'Cancelled') {
    throw new ConflictError(`Cannot escalate a ${status.toLowerCase()} ticket.`);
  }

  const current = Number(record.EscalationLevel ?? 0) || 0;
  const next = input.level ?? current + 1;
  if (next > 10) {
    throw new BusinessRuleError('Escalation level cannot exceed 10.');
  }

  const changes: DfRecord = { EscalationLevel: next };
  if (input.raisePriorityTo) {
    changes.Priority = input.raisePriorityTo;
    // Re-plan the SLA against the new priority, from the original creation time.
    const created = record.CreatedDate ? new Date(String(record.CreatedDate)) : new Date();
    const sla = planSla(input.raisePriorityTo, created);
    changes.SlaPolicy = sla.slaPolicy;
    changes.FirstResponseDueDate = sla.firstResponseDueDate;
    changes.ResolutionDueDate = sla.resolutionDueDate;
  }
  if (input.assignmentGroup) changes.AssignmentGroup = input.assignmentGroup;

  const dto = await patch(record, changes);

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: `Escalated to level ${next}. ${input.reason}`,
    isInternal: true,
    channel: 'Web',
  });

  logger.warn(
    { ticketId, level: next, priority: input.raisePriorityTo ?? record.Priority, actor: actor.email },
    'SupportDeskApi | TicketEscalated',
  );
  return dto;
}

export async function updateTicketFields(
  ticketId: string,
  input: Record<string, string | undefined>,
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);

  const map: Record<string, string> = {
    priority: 'Priority',
    category: 'Category',
    subcategory: 'Subcategory',
    orderNumber: 'OrderNumber',
    productSku: 'ProductSku',
    productName: 'ProductName',
    batchCode: 'BatchCode',
    purchaseChannel: 'PurchaseChannel',
    organization: 'Organization',
    department: 'Department',
    customerName: 'CustomerName',
    customerPhone: 'CustomerPhone',
    assignmentGroup: 'AssignmentGroup',
  };

  const changes: DfRecord = {};
  const changed: string[] = [];
  for (const [key, column] of Object.entries(map)) {
    const value = input[key];
    if (value !== undefined) {
      changes[column] = value;
      changed.push(column);
    }
  }

  // Re-planning SLA on a priority change keeps the deadline honest.
  if (input.priority) {
    const created = record.CreatedDate ? new Date(String(record.CreatedDate)) : new Date();
    const sla = planSla(input.priority as Priority, created);
    changes.SlaPolicy = sla.slaPolicy;
    changes.FirstResponseDueDate = sla.firstResponseDueDate;
    changes.ResolutionDueDate = sla.resolutionDueDate;
  }

  const dto = await patch(record, changes);

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: `Updated: ${changed.join(', ')}.`,
    isInternal: true,
    channel: 'Web',
  });

  return dto;
}

/** Stamps the first-response clock the first time an agent replies to the customer. */
export async function markFirstResponse(ticketId: string): Promise<void> {
  const record = await findTicketRecord(ticketId);
  if (!record || record.FirstResponseDate) return;
  await updateRecord(TICKET, { Id: record.Id, FirstResponseDate: nowIso() });
  logger.info({ ticketId }, 'SupportDeskApi | FirstResponseRecorded');
}
