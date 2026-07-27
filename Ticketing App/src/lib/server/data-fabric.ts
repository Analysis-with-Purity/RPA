/**
 * Data Fabric client for the Purity app.
 *
 * Authenticates with the same `UIPATH_SECRET` Personal Access Token the queue trigger
 * already uses. That matters: a PAT carries a *user* identity, which holds Data Fabric
 * entity permissions. An External Application does not get those permissions from OAuth
 * scopes alone — Data Fabric keeps its own role store — which is why the separate
 * client-credentials service could mint a perfectly-scoped token and still be told
 * "You don't have permission to access the entity, field or record".
 *
 * Server-only. `UIPATH_SECRET` has no NEXT_PUBLIC_ prefix, so it never reaches the browser.
 */

/**
 * The tenant's live ticket entity — this is what the SupportTicketIntake robot writes for
 * every Q_Intake item. The narrower `Ticket` entity is a leftover from an earlier prototype
 * and nothing populates it, so reading it would show a permanently stale single row.
 */
const ENTITY_TICKET = "SupportTicket";

/** Audit trail. Every workflow writes a row here on each state change. */
const ENTITY_TICKET_AUDIT = "TicketAudit";

interface DfConfig {
  base: string;
  secret: string;
}

export type DfRecord = Record<string, unknown>;

function readConfig(): DfConfig | null {
  const {
    UIPATH_BASE_URL,
    UIPATH_ORG,
    UIPATH_TENANT,
    UIPATH_SECRET,
    DATA_FABRIC_API_SEGMENT,
  } = process.env;

  if (!UIPATH_ORG || !UIPATH_TENANT || !UIPATH_SECRET) return null;

  const root = (UIPATH_BASE_URL || "https://cloud.uipath.com").replace(/\/$/, "");
  // Docs specify `datafabric_/api`; some tenants also answer on `dataservice_/api`.
  const segment = DATA_FABRIC_API_SEGMENT || "datafabric_/api";

  return {
    base: `${root}/${UIPATH_ORG}/${UIPATH_TENANT}/${segment}`,
    secret: UIPATH_SECRET,
  };
}

export function isDataFabricConfigured(): boolean {
  return readConfig() !== null;
}

export class DataFabricError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "DataFabricError";
    this.status = status;
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const cfg = readConfig();
  if (!cfg) throw new DataFabricError("UiPath is not configured (see .env.example).", 0);

  let res: Response;
  try {
    res = await fetch(`${cfg.base}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
      // Ticket data is request-scoped; caching it would show one agent another's view.
      cache: "no-store",
    });
  } catch (err) {
    throw new DataFabricError(
      `Could not reach Data Fabric: ${err instanceof Error ? err.message : String(err)}`,
      0,
    );
  }

  const text = await res.text();

  if (!res.ok) {
    const hint =
      res.status === 401
        ? " The PAT is invalid or expired — regenerate UIPATH_SECRET."
        : res.status === 403
          ? " The token's identity holds no Data Fabric role. A PAT inherits the user's" +
            " permissions; an External Application needs a role granted in Data Fabric."
          : res.status === 404
            ? ` Entity not found, or DATA_FABRIC_API_SEGMENT is wrong for this tenant.`
            : "";
    throw new DataFabricError(
      `Data Fabric returned HTTP ${res.status}.${hint} ${text.slice(0, 300)}`,
      res.status,
    );
  }

  return (text ? JSON.parse(text) : {}) as T;
}

export interface QueryFilter {
  fieldName: string;
  operator: string;
  value: string | number | boolean | null;
}

export interface FilterGroup {
  /** 0 = AND, 1 = OR. */
  logicalOperator: 0 | 1;
  queryFilters: QueryFilter[];
}

export interface QueryOptions {
  selectedFields?: string[];
  filterGroup?: FilterGroup;
  sortOptions?: Array<{ fieldName: string; isDescending: boolean }>;
  start?: number;
  limit?: number;
}

export async function queryRecords<T = DfRecord>(
  entity: string,
  options: QueryOptions = {},
): Promise<{ totalRecordCount: number; value: T[] }> {
  const result = await call<{ totalRecordCount?: number; value?: T[] }>(
    `/EntityService/${encodeURIComponent(entity)}/query`,
    {
      start: options.start ?? 0,
      // Data Fabric caps a single query at 1000 rows.
      limit: Math.min(options.limit ?? 100, 1000),
      ...(options.selectedFields ? { selectedFields: options.selectedFields } : {}),
      ...(options.filterGroup ? { filterGroup: options.filterGroup } : {}),
      ...(options.sortOptions ? { sortOptions: options.sortOptions } : {}),
    },
  );

  return {
    totalRecordCount: result.totalRecordCount ?? result.value?.length ?? 0,
    value: result.value ?? [],
  };
}

/** Insert one record. The batch endpoint is the only insert Data Fabric exposes. */
export async function insertRecord(entity: string, record: DfRecord): Promise<DfRecord> {
  const rows = await call<DfRecord[]>(
    `/EntityService/${encodeURIComponent(entity)}/insert-batch?expansionLevel=1&failOnFirst=true`,
    [record],
  );
  return Array.isArray(rows) ? (rows[0] ?? {}) : {};
}

/** Update one record. `record.Id` is required — it is the entity's primary key. */
export async function updateRecord(entity: string, record: DfRecord): Promise<DfRecord> {
  const rows = await call<DfRecord[]>(
    `/EntityService/${encodeURIComponent(entity)}/update-batch?expansionLevel=1&failOnFirst=true`,
    [record],
  );
  return Array.isArray(rows) ? (rows[0] ?? {}) : {};
}

/** Single record by the app-facing TicketId (not the Data Fabric GUID). */
export async function findTicketByTicketId(ticketId: string): Promise<DfRecord | null> {
  const { value } = await queryRecords(ENTITY_TICKET, {
    filterGroup: {
      logicalOperator: 0,
      queryFilters: [{ fieldName: "TicketId", operator: "=", value: ticketId }],
    },
    limit: 1,
  });
  return value[0] ?? null;
}

export { ENTITY_TICKET, ENTITY_TICKET_AUDIT };
