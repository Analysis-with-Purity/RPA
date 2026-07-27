import { env } from '../config/env.js';
import type { RefundStatus } from '../config/catalog.js';
import { toTicketDto, type TicketDto } from '../domain/ticket.js';
import { updateRecord, type DfRecord } from '../uipath/dataFabric.js';
import { BusinessRuleError, ConflictError } from '../util/errors.js';
import { logger } from '../util/logger.js';
import { addComment } from './comments.js';
import { requireTicketRecord, type ActorRef } from './tickets.js';

const TICKET = env.ENTITY_TICKET;

/**
 * Refund state machine, kept separate from the ticket status machine because a refund can
 * progress while the ticket is still open, and a ticket can close without any refund.
 *
 *   None -> Requested -> Approved -> Processed
 *                     -> Rejected
 */
const REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  None: ['Requested'],
  Requested: ['Approved', 'Rejected'],
  Approved: ['Processed', 'Rejected'],
  Processed: [],
  Rejected: ['Requested'], // a rejection can be appealed with new evidence
};

function currentRefundStatus(record: DfRecord): RefundStatus {
  const raw = String(record.RefundStatus ?? 'None');
  return (['None', 'Requested', 'Approved', 'Processed', 'Rejected'] as RefundStatus[]).includes(
    raw as RefundStatus,
  )
    ? (raw as RefundStatus)
    : 'None';
}

function assertRefundTransition(from: RefundStatus, to: RefundStatus): void {
  if (!REFUND_TRANSITIONS[from].includes(to)) {
    throw new ConflictError(`Cannot move a refund from "${from}" to "${to}".`, {
      from,
      to,
      allowed: REFUND_TRANSITIONS[from],
    });
  }
}

async function patch(record: DfRecord, changes: DfRecord): Promise<TicketDto> {
  const updated = await updateRecord(TICKET, { Id: record.Id, ...changes });
  const merged = updated && Object.keys(updated).length > 3 ? updated : { ...record, ...changes };
  return toTicketDto(merged);
}

export async function requestRefund(
  ticketId: string,
  input: { amount: number; reason: string },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  assertRefundTransition(currentRefundStatus(record), 'Requested');

  const dto = await patch(record, {
    RefundStatus: 'Requested',
    RefundAmount: Number(input.amount.toFixed(2)),
  });

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: `Refund of ${input.amount.toFixed(2)} requested. ${input.reason}`,
    isInternal: true,
    channel: 'Web',
  });

  logger.info({ ticketId, amount: input.amount, actor: actor.email }, 'SupportDeskApi | RefundRequested');
  return dto;
}

export async function decideRefund(
  ticketId: string,
  input: { decision: 'Approved' | 'Rejected'; amount?: number; note?: string },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  const from = currentRefundStatus(record);
  assertRefundTransition(from, input.decision);

  const changes: DfRecord = { RefundStatus: input.decision };
  if (input.decision === 'Approved') {
    const amount = input.amount ?? Number(record.RefundAmount ?? 0);
    if (!amount || amount <= 0) {
      throw new BusinessRuleError(
        'An approved refund needs a positive amount. Supply `amount` if none was recorded at request time.',
      );
    }
    changes.RefundAmount = Number(amount.toFixed(2));
  }

  const dto = await patch(record, changes);

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body:
      input.decision === 'Approved'
        ? `Refund approved for ${Number(changes.RefundAmount).toFixed(2)}. ${input.note ?? ''}`.trim()
        : `Refund rejected. ${input.note ?? ''}`.trim(),
    isInternal: true,
    channel: 'Web',
  });

  logger.info(
    { ticketId, decision: input.decision, actor: actor.email },
    'SupportDeskApi | RefundDecided',
  );
  return dto;
}

/**
 * Marks an approved refund as actually paid. This records the outcome only — the money moves
 * in the payment provider, and this endpoint is what the finance integration calls afterwards.
 */
export async function settleRefund(
  ticketId: string,
  input: { reference?: string; note?: string },
  actor: ActorRef,
): Promise<TicketDto> {
  const record = await requireTicketRecord(ticketId);
  assertRefundTransition(currentRefundStatus(record), 'Processed');

  const dto = await patch(record, { RefundStatus: 'Processed' });

  await addComment(ticketId, {
    authorType: 'System',
    author: actor.name,
    authorEmail: actor.email,
    body: [
      'Refund processed.',
      input.reference ? `Payment reference: ${input.reference}.` : null,
      input.note ?? null,
    ]
      .filter(Boolean)
      .join(' '),
    isInternal: true,
    channel: 'Web',
  });

  logger.info({ ticketId, actor: actor.email }, 'SupportDeskApi | RefundProcessed');
  return dto;
}
