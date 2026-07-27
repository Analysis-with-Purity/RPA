import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
  CATEGORIES,
  CHANNELS,
  PRIORITIES,
  PURCHASE_CHANNELS,
  SLA_POLICIES,
} from '../config/catalog.js';
import { CreateTicketSchema, CustomerReplySchema } from '../domain/schemas.js';
import { toPublicTicketDto } from '../domain/ticket.js';
import { asyncHandler, validateBody } from '../middleware/common.js';
import { submitTicket } from '../services/intake.js';
import { addComment, listComments } from '../services/comments.js';
import { findTicketRecord } from '../services/tickets.js';
import { updateRecord } from '../uipath/dataFabric.js';
import { getQueueItemByReference } from '../uipath/orchestrator.js';
import { NotFoundError, ValidationError } from '../util/errors.js';

const SatisfactionSchema = z
  .object({
    score: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(10_000).optional(),
  })
  .strict();

/**
 * Storefront-facing routes. No agent JWT required — these are what the website calls.
 *
 * Every response here goes through the public projection, so internal notes, the assigned
 * agent's email, audit columns and AI scoring never leave the building.
 */
export const publicRouter = Router();

const intakeLimiter = rateLimit({
  windowMs: env.INTAKE_RATE_WINDOW_MS,
  limit: env.INTAKE_RATE_LIMIT,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    title: 'Too many ticket submissions from this address. Please wait and try again.',
    status: 429,
    code: 'rate_limited',
  },
});

/** Form metadata. Lets the website build its dropdowns from the same source the API validates against. */
publicRouter.get('/config', (_req, res) => {
  res.json({
    brand: env.BRAND_NAME,
    priorities: PRIORITIES,
    channels: CHANNELS,
    purchaseChannels: PURCHASE_CHANNELS,
    categories: CATEGORIES.map((c) => ({
      name: c.name,
      subcategories: c.subcategories,
      minimumPriority: c.minimumPriority ?? null,
      requiresBatchCode: Boolean(c.requiresBatchCode),
      productRelevant: Boolean(c.productRelevant),
      orderRelevant: Boolean(c.orderRelevant),
    })),
    slaPolicies: Object.values(SLA_POLICIES),
    limits: {
      subject: 500,
      description: 10_000,
      customerEmail: 320,
      attachmentReferences: 20,
    },
    notes: [
      'Status is never accepted from the client. Every ticket is created as "Not Assigned".',
      'Provide customerEmail or customerPhone so the customer can be contacted.',
      'Health & Safety reports require batchCode so the affected batch can be traced.',
      'Omit optional fields entirely rather than sending empty strings or placeholders.',
    ],
  });
});

/**
 * Submit a ticket.
 *
 * Returns 202, not 201: the ticket is queued and a robot creates the record moments later.
 * The ticket id is generated here and is immediately usable for status lookup.
 */
publicRouter.post(
  '/tickets',
  intakeLimiter,
  validateBody(CreateTicketSchema),
  asyncHandler(async (req, res) => {
    const result = await submitTicket(req.body);
    res.status(202).json({
      ...result,
      message:
        'Your request has been received and is being logged. Use the ticket id to check its status.',
      statusUrl: `/api/tickets/${result.ticketId}`,
    });
  }),
);

/**
 * Public status lookup.
 *
 * Immediately after submission the Data Fabric record may not exist yet, so fall back to the
 * queue transaction to distinguish "still processing" from "intake failed" from "no such
 * ticket". Without this the website would show a confusing 404 for a few seconds after every
 * successful submission.
 */
publicRouter.get(
  '/tickets/:ticketId',
  asyncHandler(async (req, res) => {
    const ticketId = String(req.params.ticketId);
    const record = await findTicketRecord(ticketId);

    if (record) {
      res.json({ state: 'logged', ticket: toPublicTicketDto(record) });
      return;
    }

    const queueItem = await getQueueItemByReference(ticketId);
    if (!queueItem) {
      throw new NotFoundError(
        `No ticket found with id "${ticketId}". Check the id from your confirmation message.`,
      );
    }

    const status = String(queueItem.Status ?? '');
    if (status === 'New' || status === 'InProgress') {
      res.status(202).json({
        state: 'processing',
        ticketId,
        message: 'Your request has been received and is being logged. Check back shortly.',
      });
      return;
    }

    // Failed intake. Do not leak the internal reason to a customer.
    res.status(202).json({
      state: 'needs_attention',
      ticketId,
      message:
        'We received your request but could not log it automatically. Our support team has been alerted.',
    });
  }),
);

/** Customer-visible conversation. Internal notes are filtered out server-side. */
publicRouter.get(
  '/tickets/:ticketId/comments',
  asyncHandler(async (req, res) => {
    const ticketId = String(req.params.ticketId);
    const record = await findTicketRecord(ticketId);
    if (!record) throw new NotFoundError(`No ticket found with id "${ticketId}".`);

    const { total, items } = await listComments(ticketId, { includeInternal: false });
    res.json({ ticketId, total, items });
  }),
);

/**
 * Customer reply. Requires the email on file to match, so one ticket id is not enough to post
 * as somebody else.
 */
publicRouter.post(
  '/tickets/:ticketId/replies',
  intakeLimiter,
  validateBody(CustomerReplySchema),
  asyncHandler(async (req, res) => {
    const ticketId = String(req.params.ticketId);
    const claimedEmail = String(req.query.email ?? '').trim().toLowerCase();
    if (!claimedEmail) {
      throw new ValidationError(
        'Pass ?email= matching the address on the ticket to post a reply.',
      );
    }

    const record = await findTicketRecord(ticketId);
    if (!record) throw new NotFoundError(`No ticket found with id "${ticketId}".`);

    const onFile = String(record.CustomerEmail ?? '').trim().toLowerCase();
    if (!onFile || onFile !== claimedEmail) {
      // Deliberately the same shape as a missing ticket — do not confirm that the id exists
      // to someone who cannot prove they own it.
      throw new NotFoundError(`No ticket found with id "${ticketId}".`);
    }

    const status = String(record.Status ?? '');
    if (status === 'Cancelled') {
      throw new ValidationError('This ticket was cancelled and can no longer receive replies.');
    }

    const comment = await addComment(ticketId, {
      authorType: 'Customer',
      author: String(record.CustomerName ?? claimedEmail),
      authorEmail: claimedEmail,
      body: req.body.body,
      isInternal: false,
      channel: 'Web',
      attachmentReferences: req.body.attachmentReferences,
    });

    res.status(201).json({ ticketId, comment });
  }),
);

/** Post-resolution satisfaction score. */
publicRouter.post(
  '/tickets/:ticketId/satisfaction',
  asyncHandler(async (req, res) => {
    const ticketId = String(req.params.ticketId);
    const parsed = SatisfactionSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new ValidationError('score must be an integer from 1 to 5.', {
        fieldErrors: parsed.error.issues.map((i) => ({
          field: i.path.join('.') || '(body)',
          message: i.message,
        })),
      });
    }
    const { score, comment: satisfactionComment } = parsed.data;

    const record = await findTicketRecord(ticketId);
    if (!record) throw new NotFoundError(`No ticket found with id "${ticketId}".`);

    const status = String(record.Status ?? '');
    if (status !== 'Resolved' && status !== 'Closed') {
      throw new ValidationError('Satisfaction can only be rated once the ticket is resolved.');
    }

    await updateRecord(env.ENTITY_TICKET, { Id: record.Id, CsatScore: score });

    if (satisfactionComment) {
      await addComment(ticketId, {
        authorType: 'Customer',
        author: String(record.CustomerName ?? 'Customer'),
        authorEmail: String(record.CustomerEmail ?? '') || undefined,
        body: satisfactionComment,
        isInternal: false,
        channel: 'Web',
      });
    }

    res.json({ ticketId, score, message: 'Thank you for your feedback.' });
  }),
);
