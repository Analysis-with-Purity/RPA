import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { corsOrigins, env } from './config/env.js';
import { logger } from './util/logger.js';
import { errorHandler, notFoundHandler } from './middleware/common.js';
import { publicRouter } from './routes/public.js';
import { agentRouter } from './routes/agent.js';
import { opsRouter } from './routes/ops.js';

export function createApp() {
  const app = express();

  // Behind a load balancer or PaaS, trust the proxy so rate limiting keys on the real client
  // IP rather than the balancer's.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins === '*' ? true : corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['content-type', 'authorization'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: '256kb' }));

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      // Health probes fire constantly; logging them at info drowns real traffic.
      autoLogging: {
        ignore: (req) => req.url === '/api/health',
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // ops first: /api/health must answer even if nothing else is wired.
  app.use('/api', opsRouter);
  app.use('/api', publicRouter);
  app.use('/api/agent', agentRouter);

  app.get('/', (_req, res) => {
    res.json({
      service: 'support-desk-api',
      brand: env.BRAND_NAME,
      docs: '/api/config',
      health: '/api/health',
      readiness: '/api/health/upstream',
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
