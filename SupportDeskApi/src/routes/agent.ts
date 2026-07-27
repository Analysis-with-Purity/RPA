import { Router } from 'express';
import {
  AddCommentSchema,
  AssignSchema,
  CloseSchema,
  EscalateSchema,
  RefundDecisionSchema,
  RefundRequestSchema,
  RefundSettleSchema,
  ResolveSchema,
  StatusChangeSchema,
  TicketSearchSchema,
  UpdateTicketSchema,
} from '../domain/schemas.js';
import { STATUS_TRANSITIONS } from '../config/catalog.js';
import { actorOf, authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, queryOf, validateBody, validateQuery } from '../middleware/common.js';
import { addComment, listComments } from '../services/comments.js';
import { decideRefund, requestRefund, settleRefund } from '../services/refunds.js';
import {
  assignTicket,
  changeStatus,
  closeTicket,
  escalateTicket,
  getTicket,
  markFirstResponse,
  resolveTicket,
  searchTickets,
  updateTicketFields,
} from '../services/tickets.js';
import type { TicketSearchInput } from '../domain/schemas.js';

/**
 * Back-office routes. Every route requires a valid agent JWT.
 *
 * Role model: `agent` handles day-to-day work; `supervisor` additionally decides refunds and
 * escalations; `admin` can do everything.
 */
export const agentRouter = Router();

agentRouter.use(authenticate);

// -------------------------------------------------------------------------- reads

agentRouter.get(
  '/tickets',
  requireRole('agent', 'supervisor'),
  validateQuery(TicketSearchSchema),
  asyncHandler(async (req, res) => {
    const result = await searchTickets(queryOf<TicketSearchInput>(req));
    res.json(result);
  }),
);

agentRouter.get(
  '/tickets/:ticketId',
  requireRole('agent', 'supervisor'),
  asyncHandler(async (req, res) => {
    res.json(await getTicket(String(req.params.ticketId)));
  }),
);

/** Full thread including internal notes. */
agentRouter.get(
  '/tickets/:ticketId/comments',
  requireRole('agent', 'supervisor'),
  asyncHandler(async (req, res) => {
    const ticketId = String(req.params.ticketId);
    const { total, items } = await listComments(ticketId, { includeInternal: true });
    res.json({ ticketId, total, items });
  }),
);

/** The legal next statuses for this ticket — lets a console render only valid buttons. */
agentRouter.get(
  '/tickets/:ticketId/transitions',
  requireRole('agent', 'supervisor'),
  asyncHandler(async (req, res) => {
    const ticket = await getTicket(String(req.params.ticketId));
    res.json({
      ticketId: ticket.ticketId,
      currentStatus: ticket.status,
      allowedStatuses: STATUS_TRANSITIONS[ticket.status] ?? [],
    });
  }),
);

// ------------------------------------------------------------------- ticket writes

agentRouter.patch(
  '/tickets/:ticketId',
  requireRole('agent', 'supervisor'),
  validateBody(UpdateTicketSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateTicketFields(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

agentRouter.post(
  '/tickets/:ticketId/assign',
  requireRole('agent', 'supervisor'),
  validateBody(AssignSchema),
  asyncHandler(async (req, res) => {
    res.json(await assignTicket(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

/** Self-assign — the common case, so it does not require naming yourself. */
agentRouter.post(
  '/tickets/:ticketId/claim',
  requireRole('agent', 'supervisor'),
  asyncHandler(async (req, res) => {
    const actor = actorOf(req);
    res.json(
      await assignTicket(
        String(req.params.ticketId),
        { agentName: actor.name, agentEmail: actor.email, note: 'Self-assigned.' },
        actor,
      ),
    );
  }),
);

agentRouter.post(
  '/tickets/:ticketId/status',
  requireRole('agent', 'supervisor'),
  validateBody(StatusChangeSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await changeStatus(String(req.params.ticketId), req.body.status, req.body.note, actorOf(req)),
    );
  }),
);

agentRouter.post(
  '/tickets/:ticketId/resolve',
  requireRole('agent', 'supervisor'),
  validateBody(ResolveSchema),
  asyncHandler(async (req, res) => {
    res.json(await resolveTicket(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

agentRouter.post(
  '/tickets/:ticketId/close',
  requireRole('agent', 'supervisor'),
  validateBody(CloseSchema),
  asyncHandler(async (req, res) => {
    res.json(await closeTicket(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

agentRouter.post(
  '/tickets/:ticketId/escalate',
  requireRole('supervisor'),
  validateBody(EscalateSchema),
  asyncHandler(async (req, res) => {
    res.json(await escalateTicket(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

// ----------------------------------------------------------------------- comments

agentRouter.post(
  '/tickets/:ticketId/comments',
  requireRole('agent', 'supervisor'),
  validateBody(AddCommentSchema),
  asyncHandler(async (req, res) => {
    const ticketId = String(req.params.ticketId);
    const actor = actorOf(req);

    const comment = await addComment(ticketId, {
      authorType: req.body.authorType,
      author: req.body.author || actor.name,
      authorEmail: req.body.authorEmail ?? actor.email,
      body: req.body.body,
      isInternal: req.body.isInternal,
      channel: req.body.channel,
      attachmentReferences: req.body.attachmentReferences,
    });

    // A customer-visible agent reply stops the first-response SLA clock.
    if (!req.body.isInternal && req.body.authorType === 'Agent') {
      await markFirstResponse(ticketId);
    }

    res.status(201).json({ ticketId, comment });
  }),
);

// ------------------------------------------------------------------------ refunds

agentRouter.post(
  '/tickets/:ticketId/refund/request',
  requireRole('agent', 'supervisor'),
  validateBody(RefundRequestSchema),
  asyncHandler(async (req, res) => {
    res.json(await requestRefund(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

/** Approving money is a supervisor decision. */
agentRouter.post(
  '/tickets/:ticketId/refund/decision',
  requireRole('supervisor'),
  validateBody(RefundDecisionSchema),
  asyncHandler(async (req, res) => {
    res.json(await decideRefund(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);

agentRouter.post(
  '/tickets/:ticketId/refund/settle',
  requireRole('supervisor'),
  validateBody(RefundSettleSchema),
  asyncHandler(async (req, res) => {
    res.json(await settleRefund(String(req.params.ticketId), req.body, actorOf(req)));
  }),
);
