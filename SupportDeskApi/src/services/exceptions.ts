import { env } from '../config/env.js';
import type { ExceptionSearchInput } from './types.js';
import {
  getRecordById,
  queryRecords,
  updateRecord,
  type DfRecord,
  type QueryFilter,
} from '../uipath/dataFabric.js';
import { BusinessRuleError, NotFoundError } from '../util/errors.js';
import { logger } from '../util/logger.js';
import { resubmitRawPayload } from './intake.js';
import type { ActorRef } from './tickets.js';

const EXCEPTION = env.ENTITY_EXCEPTION;

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
  /** True when the payload contains enough to be replayed. */
  replayable: boolean;
}

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function toDto(r: DfRecord): ExceptionDto {
  const payload = parsePayload(r.RawPayload);
  const reason = String(r.ExceptionReason ?? '');
  // A duplicate has nothing to replay — the record already exists.
  const replayable = payload !== null && Boolean(payload.TicketId) && reason !== 'DuplicateTicket';

  return {
    id: String(r.Id ?? ''),
    ticketId: (r.TicketId as string) || null,
    ticketNumber: (r.TicketNumber as string) || null,
    exceptionType: String(r.ExceptionType ?? ''),
    exceptionReason: reason,
    errorMessage: (r.ErrorMessage as string) || null,
    stackTrace: (r.StackTrace as string) || null,
    rawPayload: payload,
    rawPayloadText: (r.RawPayload as string) || null,
    workflowInstanceId: (r.WorkflowInstanceId as string) || null,
    queueItemReference: (r.QueueItemReference as string) || null,
    occurredAt: (r.OccurredAt as string) || null,
    retryCount: Number(r.RetryCount ?? 0) || 0,
    notifiedAdmin: r.NotifiedAdmin === true || r.NotifiedAdmin === 'true',
    resolved: r.Resolved === true || r.Resolved === 'true',
    resolvedAt: (r.ResolvedAt as string) || null,
    sourceSystem: (r.SourceSystem as string) || null,
    replayable,
  };
}

export async function searchExceptions(
  q: ExceptionSearchInput,
): Promise<{ total: number; limit: number; offset: number; items: ExceptionDto[] }> {
  const queryFilters: QueryFilter[] = [];
  if (q.resolved !== undefined) {
    queryFilters.push({ fieldName: 'Resolved', operator: '=', value: String(q.resolved) });
  }
  if (q.exceptionType) {
    queryFilters.push({ fieldName: 'ExceptionType', operator: '=', value: q.exceptionType });
  }
  if (q.exceptionReason) {
    queryFilters.push({ fieldName: 'ExceptionReason', operator: '=', value: q.exceptionReason });
  }

  const result = await queryRecords<DfRecord>(EXCEPTION, {
    ...(queryFilters.length ? { filterGroup: { logicalOperator: 0, queryFilters } } : {}),
    start: q.offset,
    limit: q.limit,
    sortOptions: [{ fieldName: 'OccurredAt', isDescending: true }],
  });

  return {
    total: result.totalRecordCount,
    limit: q.limit,
    offset: q.offset,
    items: result.value.map(toDto),
  };
}

export async function getException(id: string): Promise<ExceptionDto> {
  const record = await getRecordById<DfRecord>(EXCEPTION, id);
  if (!record) throw new NotFoundError(`No intake exception found with id "${id}".`);
  return toDto(record);
}

/**
 * Re-queues a failed submission from its captured payload.
 *
 * This is the operational reason `RawPayload` exists: a ticket that failed intake because a
 * downstream dependency was down can be replayed without the customer resubmitting.
 */
export async function replayException(
  id: string,
  actor: ActorRef,
): Promise<{ exceptionId: string; ticketId: string; queueItemId: number }> {
  const record = await getRecordById<DfRecord>(EXCEPTION, id);
  if (!record) throw new NotFoundError(`No intake exception found with id "${id}".`);
  const dto = toDto(record);

  if (dto.resolved) {
    throw new BusinessRuleError(
      'This exception is already marked resolved. Un-resolve it first if you genuinely need to replay.',
    );
  }
  if (!dto.rawPayload) {
    throw new BusinessRuleError(
      'The captured payload is missing or not valid JSON, so it cannot be replayed. Ask the customer to resubmit.',
    );
  }
  if (dto.exceptionReason === 'DuplicateTicket') {
    throw new BusinessRuleError(
      'A duplicate has nothing to replay — a ticket with this id already exists. Verify with GET /api/tickets/{ticketId}, then resolve this exception.',
    );
  }
  const ticketId = String(dto.rawPayload.TicketId ?? '');
  if (!ticketId) {
    throw new BusinessRuleError(
      'The captured payload has no TicketId, so replaying it would fail the same validation again.',
    );
  }

  const { queueItemId } = await resubmitRawPayload(dto.rawPayload, ticketId);

  await updateRecord(EXCEPTION, {
    Id: dto.id,
    RetryCount: dto.retryCount + 1,
  });

  logger.info(
    { exceptionId: dto.id, ticketId, queueItemId, actor: actor.email },
    'SupportDeskApi | IntakeExceptionReplayed',
  );

  return { exceptionId: dto.id, ticketId, queueItemId };
}

export async function resolveException(
  id: string,
  _input: { note?: string },
  actor: ActorRef,
): Promise<ExceptionDto> {
  const record = await getRecordById<DfRecord>(EXCEPTION, id);
  if (!record) throw new NotFoundError(`No intake exception found with id "${id}".`);

  const updated = await updateRecord(EXCEPTION, {
    Id: String(record.Id),
    Resolved: true,
    ResolvedAt: new Date().toISOString(),
  });

  logger.info({ exceptionId: id, actor: actor.email }, 'SupportDeskApi | IntakeExceptionResolved');
  return toDto(updated && Object.keys(updated).length > 3 ? updated : { ...record, Resolved: true });
}
