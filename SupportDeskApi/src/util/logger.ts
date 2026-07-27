import { pino } from 'pino';
import { env, isProd } from '../config/env.js';

/**
 * Log shape deliberately mirrors the automation's convention so both halves of the system
 * are searchable together. The automation emits
 *   `SupportTicketIntake | <Event> | Key=Value | ...`
 * with a `workflowInstanceId` custom field; here the equivalent correlation key is
 * `ticketId` plus the per-request `reqId`.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'support-desk-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.clientSecret',
      '*.client_secret',
      '*.access_token',
      '*.password',
      '*.customerPhone',
    ],
    censor: '[redacted]',
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino/file',
          options: { destination: 1 },
        },
      }),
});
