import { env } from '../config/env.js';
import {
  assignmentGroupFor,
  effectivePriority,
  findCategory,
  type Priority,
} from '../config/catalog.js';
import { generateTicketId, generateTicketNumber } from '../domain/ids.js';
import type { CreateTicketInput } from '../domain/schemas.js';
import { serializeAttachments } from '../domain/ticket.js';
import { addQueueItem, type QueuePriority } from '../uipath/orchestrator.js';
import { logger } from '../util/logger.js';

/**
 * Intake is the one write path that does NOT go straight to Data Fabric.
 *
 * The submission is placed on Q_Intake and the UiPath robot creates the record. That keeps a
 * single writer for ticket creation — the automation owns validation, duplicate detection and
 * the `Status = "Not Assigned"` guarantee — and means a Data Fabric outage queues work rather
 * than dropping it.
 *
 * The API therefore returns 202 Accepted with the generated ticket id, not the stored record.
 */

const QUEUE_PRIORITY: Record<Priority, QueuePriority> = {
  Urgent: 'High',
  High: 'High',
  Medium: 'Normal',
  Low: 'Low',
};

export interface SubmitResult {
  ticketId: string;
  ticketNumber: string;
  status: 'queued';
  priority: Priority;
  priorityRaised: boolean;
  priorityRaisedReason?: string;
  assignmentGroup: string;
  queueItemId: number;
  queueReference: string;
  submittedAt: string;
}

export async function submitTicket(input: CreateTicketInput): Promise<SubmitResult> {
  const now = new Date();
  const ticketId = generateTicketId(now);
  const ticketNumber = generateTicketNumber();

  const { priority, raised, reason } = effectivePriority(input.priority, input.category);
  const assignmentGroup = assignmentGroupFor(input.category);

  if (raised) {
    logger.warn(
      { ticketId, submitted: input.priority, effective: priority, category: input.category },
      'Priority raised to category floor',
    );
  }

  // Flat string map — the robot reads every value with .ToString(), and Orchestrator
  // SpecificContent is not a place for nested objects.
  const specificContent: Record<string, string | number | boolean> = {
    TicketId: ticketId,
    TicketNumber: ticketNumber,
    Subject: input.subject,
    Description: input.description,
    Priority: priority,
    Channel: input.channel,
    SourceSystem: env.SOURCE_SYSTEM,
    CreatedDate: (input.createdDate ? new Date(input.createdDate) : now).toISOString(),
  };

  const optional: Record<string, string | undefined> = {
    Category: input.category,
    Subcategory: input.subcategory,
    CustomerName: input.customerName,
    CustomerEmail: input.customerEmail,
    CustomerPhone: input.customerPhone,
    Organization: input.organization,
    Department: input.department,
    OrderNumber: input.orderNumber,
    ProductSku: input.productSku,
    ProductName: input.productName,
    BatchCode: input.batchCode,
    PurchaseChannel: input.purchaseChannel,
    AttachmentReferences: serializeAttachments(input.attachmentReferences),
  };

  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined && value !== '') specificContent[key] = value;
  }

  // Deliberately never sent: Status. The automation ignores it and always writes
  // "Not Assigned"; sending it would imply the caller has a say, which it does not.

  const item = await addQueueItem({
    reference: ticketId,
    priority: QUEUE_PRIORITY[priority],
    specificContent,
  });

  logger.info(
    {
      ticketId,
      queueItemId: item.Id,
      priority,
      category: input.category ?? null,
      assignmentGroup,
      hasOrder: Boolean(input.orderNumber),
      hasBatch: Boolean(input.batchCode),
    },
    'SupportDeskApi | TicketQueued',
  );

  return {
    ticketId,
    ticketNumber,
    status: 'queued',
    priority,
    priorityRaised: raised,
    ...(reason ? { priorityRaisedReason: reason } : {}),
    assignmentGroup,
    queueItemId: item.Id,
    queueReference: item.Reference ?? ticketId,
    submittedAt: now.toISOString(),
  };
}

/**
 * Re-submits a payload that previously failed intake. Used by the exception replay endpoint.
 * The original ticket id is preserved so the replay is traceable to the failure.
 */
export async function resubmitRawPayload(
  rawPayload: Record<string, unknown>,
  reference: string,
): Promise<{ queueItemId: number }> {
  const specificContent: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (value === null || value === undefined) continue;
    if (key === 'Status') continue; // never replay a status
    specificContent[key] = typeof value === 'object' ? JSON.stringify(value) : (value as string);
  }

  const item = await addQueueItem({
    reference,
    priority: 'High', // a replay has already waited once
    specificContent,
  });

  logger.info({ reference, queueItemId: item.Id }, 'SupportDeskApi | TicketReplayed');
  return { queueItemId: item.Id };
}

export const categoryMeta = { findCategory };
