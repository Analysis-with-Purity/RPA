import { createApp } from './app.js';
import { env, dataFabricBase, orchestratorBase } from './config/env.js';
import { logger } from './util/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      brand: env.BRAND_NAME,
      org: env.UIPATH_ORG,
      tenant: env.UIPATH_TENANT,
      queue: env.UIPATH_QUEUE_NAME,
      orchestrator: orchestratorBase,
      dataFabric: dataFabricBase,
    },
    'support-desk-api listening',
  );
});

/**
 * Drain in-flight requests before exiting. Without this, a rolling deploy can abort a
 * submission after the queue item was created but before the response was sent — the
 * customer sees a failure for a ticket that was in fact logged.
 */
function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
    process.exit(0);
  });
  // Backstop so a hung socket cannot block the deploy indefinitely.
  setTimeout(() => {
    logger.warn('Forcing exit after shutdown timeout');
    process.exit(1);
  }, 15_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});
