import { z } from 'zod';

/**
 * Environment contract. Parsed once at boot — the process refuses to start on a bad
 * config rather than failing on the first request.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /** Comma-separated allowed browser origins. Use `*` only in development. */
  CORS_ORIGINS: z.string().default('*'),

  // ---------------------------------------------------------------- UiPath cloud
  UIPATH_BASE_URL: z.string().url().default('https://cloud.uipath.com'),
  UIPATH_ORG: z.string().min(1),
  UIPATH_TENANT: z.string().min(1),

  /** External Application (client credentials). Never a user PAT. */
  UIPATH_CLIENT_ID: z.string().min(1),
  UIPATH_CLIENT_SECRET: z.string().min(1),
  /**
   * Scopes to request. Must be a subset of what the External Application was granted.
   * Data Fabric scope tokens have differed across releases — if the token request is
   * rejected for an unknown scope, check the exact strings shown on the app in
   * Admin -> External Applications and copy them here verbatim.
   */
  UIPATH_SCOPES: z
    .string()
    .default(
      'OR.Queues.Read OR.Queues.Write OR.Folders.Read OR.Assets.Read DataService.Data.Read DataService.Data.Write DataService.Schema.Read',
    ),

  /** Orchestrator folder holding Q_Intake and the assets. */
  UIPATH_FOLDER_PATH: z.string().default('Shared'),
  /** Folder key (GUID). Preferred over folder path — avoids a lookup per request. */
  UIPATH_FOLDER_KEY: z.string().uuid().optional(),

  /** Intake queue the robot consumes. */
  UIPATH_QUEUE_NAME: z.string().default('Q_Intake'),

  /**
   * Data Fabric API base segment. Docs specify `datafabric_/api`; some tenants also
   * answer on `dataservice_/api`. Overridable so a tenant difference is a config
   * change, not a code change. Verify with GET /api/health/upstream.
   */
  DATA_FABRIC_API_SEGMENT: z.string().default('datafabric_/api'),

  // ------------------------------------------------------------ Data Fabric names
  ENTITY_TICKET: z.string().default('SupportTicket'),
  ENTITY_COMMENT: z.string().default('TicketComment'),
  ENTITY_EXCEPTION: z.string().default('TicketIntakeException'),

  // ----------------------------------------------------------------- agent auth
  /** HS256 secret used to sign and verify agent/admin JWTs. Minimum 32 chars. */
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default('support-desk-api'),
  JWT_AUDIENCE: z.string().default('support-desk'),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(28800),

  // -------------------------------------------------------------- brand / intake
  BRAND_NAME: z.string().default('Maison Fragrance'),
  SOURCE_SYSTEM: z.string().default('SupportTicketingApp'),
  /** Prefix for generated ticket ids, e.g. TCK-2Q7F4K9B. */
  TICKET_ID_PREFIX: z.string().default('TCK'),

  /** Submissions per window, per IP, on the public intake endpoint. */
  INTAKE_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  INTAKE_RATE_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${detail}\n\nSee .env.example.`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export const isProd = env.NODE_ENV === 'production';

/** Absolute base for Orchestrator OData. */
export const orchestratorBase = `${env.UIPATH_BASE_URL}/${env.UIPATH_ORG}/${env.UIPATH_TENANT}/orchestrator_`;

/** Absolute base for Data Fabric entity endpoints. */
export const dataFabricBase = `${env.UIPATH_BASE_URL}/${env.UIPATH_ORG}/${env.UIPATH_TENANT}/${env.DATA_FABRIC_API_SEGMENT}`;

/** Identity Server token endpoint (organization-scoped is not required for client credentials). */
export const tokenEndpoint = `${env.UIPATH_BASE_URL}/identity_/connect/token`;

export const corsOrigins: string[] | '*' =
  env.CORS_ORIGINS.trim() === '*'
    ? '*'
    : env.CORS_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
