import { env } from '../config/env.js';
import { serializeAttachments, toCommentDto, type CommentDto } from '../domain/ticket.js';
import { insertRecord, queryRecords, type DfRecord } from '../uipath/dataFabric.js';
import { logger } from '../util/logger.js';

const COMMENT = env.ENTITY_COMMENT;

export interface NewComment {
  authorType: 'Customer' | 'Agent' | 'System';
  author: string;
  authorEmail?: string;
  body: string;
  isInternal: boolean;
  channel: string;
  attachmentReferences?: string[];
  workflowInstanceId?: string;
}

/**
 * Appends to the ticket thread.
 *
 * Comments are written straight to Data Fabric rather than through the queue: unlike ticket
 * creation there is no duplicate rule, no status invariant and no need for the robot to
 * mediate, and an agent typing a reply expects it to appear immediately.
 */
export async function addComment(ticketId: string, input: NewComment): Promise<CommentDto> {
  const record: DfRecord = {
    TicketId: ticketId,
    AuthorType: input.authorType,
    Author: input.author,
    Body: input.body,
    IsInternal: input.isInternal,
    Channel: input.channel,
    PostedAt: new Date().toISOString(),
  };
  if (input.authorEmail) record.AuthorEmail = input.authorEmail;
  if (input.workflowInstanceId) record.WorkflowInstanceId = input.workflowInstanceId;
  const attachments = serializeAttachments(input.attachmentReferences);
  if (attachments) record.AttachmentReferences = attachments;

  const created = await insertRecord(COMMENT, record);

  logger.info(
    { ticketId, authorType: input.authorType, isInternal: input.isInternal },
    'SupportDeskApi | CommentAdded',
  );

  return toCommentDto(created);
}

export interface ListCommentsOptions {
  /** When false, internal notes are excluded. Always false for customer-facing reads. */
  includeInternal: boolean;
  limit?: number;
  offset?: number;
}

export async function listComments(
  ticketId: string,
  opts: ListCommentsOptions,
): Promise<{ total: number; items: CommentDto[] }> {
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;

  const queryFilters = [{ fieldName: 'TicketId', operator: '=', value: ticketId }];
  // Filtering internals server-side keeps them off the wire entirely rather than relying on
  // the caller to discard them.
  if (!opts.includeInternal) {
    queryFilters.push({ fieldName: 'IsInternal', operator: '=', value: 'false' });
  }

  const result = await queryRecords<DfRecord>(COMMENT, {
    filterGroup: { logicalOperator: 0, queryFilters },
    start: offset,
    limit,
    sortOptions: [{ fieldName: 'PostedAt', isDescending: false }],
  });

  let items = result.value.map(toCommentDto);

  // Belt-and-braces: if a tenant's boolean filter semantics differ, drop internals here too.
  if (!opts.includeInternal) items = items.filter((c) => !c.isInternal);

  return { total: result.totalRecordCount, items };
}
