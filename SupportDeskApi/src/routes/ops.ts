import { Router } from 'express';
import { env, dataFabricBase, orchestratorBase } from '../config/env.js';
import { ExceptionSearchSchema, IssueTokenSchema, ResolveExceptionSchema } from '../domain/schemas.js';
import { actorOf, authenticate, requireRole, signAgentToken } from '../middleware/auth.js';
import { asyncHandler, queryOf, validateBody, validateQuery } from '../middleware/common.js';
import {
  getException,
  replayException,
  resolveException,
  searchExceptions,
} from '../services/exceptions.js';
import type { ExceptionSearchInput } from '../services/types.js';
import { agentWorkload, batchReport, intakeHealth, slaReport, summary } from '../services/metrics.js';
import { queryRecords } from '../uipath/dataFabric.js';
import { pingOrchestrator } from '../uipath/orchestrator.js';
import { tokenState } from '../uipath/token.js';
import { isProd } from '../config/env.js';
import { ForbiddenError } from '../util/errors.js';

export const opsRouter = Router();

// ------------------------------------------------------------------------- health

/** Liveness. Deliberately unauthenticated and does not touch UiPath. */
opsRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'support-desk-api',
    brand: env.BRAND_NAME,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness. Proves the External Application can actually mint a token and reach both
 * Orchestrator and Data Fabric — the two things that silently break in a new environment.
 */
opsRouter.get(
  '/health/upstream',
  asyncHandler(async (_req, res) => {
    const checks: Record<string, { ok: boolean; detail?: string; ms?: number }> = {};

    const time = async (name: string, fn: () => Promise<string | undefined>) => {
      const started = Date.now();
      try {
        const detail = await fn();
        checks[name] = { ok: true, ms: Date.now() - started, ...(detail ? { detail } : {}) };
      } catch (err) {
        checks[name] = {
          ok: false,
          ms: Date.now() - started,
          detail: err instanceof Error ? err.message : String(err),
        };
      }
    };

    await time('orchestrator', async () => {
      const { queueFound } = await pingOrchestrator();
      return queueFound
        ? `queue "${env.UIPATH_QUEUE_NAME}" found`
        : `queue "${env.UIPATH_QUEUE_NAME}" NOT found in folder "${env.UIPATH_FOLDER_PATH}"`;
    });

    await time('dataFabric.ticket', async () => {
      const r = await queryRecords(env.ENTITY_TICKET, { limit: 1, selectedFields: ['TicketId'] });
      return `${env.ENTITY_TICKET}: ${r.totalRecordCount} records`;
    });

    await time('dataFabric.comment', async () => {
      const r = await queryRecords(env.ENTITY_COMMENT, { limit: 1, selectedFields: ['TicketId'] });
      return `${env.ENTITY_COMMENT}: ${r.totalRecordCount} records`;
    });

    await time('dataFabric.exception', async () => {
      const r = await queryRecords(env.ENTITY_EXCEPTION, {
        limit: 1,
        selectedFields: ['ExceptionType'],
      });
      return `${env.ENTITY_EXCEPTION}: ${r.totalRecordCount} records`;
    });

    const allOk = Object.values(checks).every((c) => c.ok);
    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ready' : 'degraded',
      token: tokenState(),
      endpoints: { orchestrator: orchestratorBase, dataFabric: dataFabricBase },
      checks,
      ...(allOk
        ? {}
        : {
            hint: 'A 404 on a Data Fabric check usually means DATA_FABRIC_API_SEGMENT is wrong for this tenant — try "dataservice_/api". A 403 does NOT mean missing scopes — a missing scope fails the token request instead. It means the External Application holds no Data Fabric role: grant it "Data Reader" and "Data Writer" in Data Fabric → Manage Access. Orchestrator showing "ok" alongside a Data Fabric 403 confirms the credentials are valid and the gap is authorization, not authentication.',
          }),
    });
  }),
);

// -------------------------------------------------------------------------- tokens

/**
 * Mints an agent JWT. Available only outside production, where it is the fastest way to get a
 * usable token for testing. In production, tokens must come from your identity provider —
 * this route refuses to run.
 */
opsRouter.post(
  '/auth/dev-token',
  validateBody(IssueTokenSchema),
  asyncHandler(async (req, res) => {
    if (isProd) {
      throw new ForbiddenError(
        'Dev token minting is disabled in production. Issue agent tokens from your identity provider.',
      );
    }
    const { token, expiresIn } = signAgentToken(req.body);
    res.json({ tokenType: 'Bearer', accessToken: token, expiresIn, roles: req.body.roles });
  }),
);

// ------------------------------------------------------------------------ metrics

opsRouter.use('/metrics', authenticate, requireRole('agent', 'supervisor'));

opsRouter.get(
  '/metrics/summary',
  asyncHandler(async (req, res) => {
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;
    res.json(await summary(since));
  }),
);

opsRouter.get(
  '/metrics/sla',
  asyncHandler(async (_req, res) => {
    res.json(await slaReport());
  }),
);

opsRouter.get(
  '/metrics/workload',
  asyncHandler(async (_req, res) => {
    res.json(await agentWorkload());
  }),
);

/** Batch rollup. The first screen of an adverse-event or counterfeit investigation. */
opsRouter.get(
  '/metrics/batches',
  asyncHandler(async (_req, res) => {
    res.json(await batchReport());
  }),
);

opsRouter.get(
  '/metrics/intake-health',
  asyncHandler(async (_req, res) => {
    res.json(await intakeHealth());
  }),
);

// --------------------------------------------------------------------- exceptions

const exceptionsRouter = Router();
exceptionsRouter.use(authenticate, requireRole('supervisor'));

exceptionsRouter.get(
  '/',
  validateQuery(ExceptionSearchSchema),
  asyncHandler(async (req, res) => {
    res.json(await searchExceptions(queryOf<ExceptionSearchInput>(req)));
  }),
);

exceptionsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getException(String(req.params.id)));
  }),
);

/** Re-queues a failed submission from its captured RawPayload. */
exceptionsRouter.post(
  '/:id/replay',
  asyncHandler(async (req, res) => {
    res.status(202).json(await replayException(String(req.params.id), actorOf(req)));
  }),
);

exceptionsRouter.post(
  '/:id/resolve',
  validateBody(ResolveExceptionSchema),
  asyncHandler(async (req, res) => {
    res.json(await resolveException(String(req.params.id), req.body, actorOf(req)));
  }),
);

opsRouter.use('/intake-exceptions', exceptionsRouter);
