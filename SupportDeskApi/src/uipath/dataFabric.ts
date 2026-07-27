import { dataFabricBase, env } from '../config/env.js';
import { getAccessToken, invalidateToken } from './token.js';
import { logger } from '../util/logger.js';
import { UpstreamError } from '../util/errors.js';

/** A Data Fabric record is an open bag of field values plus a system `Id`. */
export type DfRecord = Record<string, unknown> & { Id?: string };

export type LogicalOperator = 0 | 1; // 0 = AND (all), 1 = OR (any)

export interface QueryFilter {
  fieldName: string;
  operator: string;
  value: string | number | boolean | null;
}

export interface FilterGroup {
  logicalOperator: LogicalOperator;
  queryFilters: QueryFilter[];
  filterGroups?: FilterGroup[];
}

export interface SortOption {
  fieldName: string;
  isDescending: boolean;
}

export interface QueryBody {
  selectedFields?: string[];
  filterGroup?: FilterGroup;
  start?: number;
  limit?: number;
  sortOptions?: SortOption[];
}

export interface QueryResult<T = DfRecord> {
  totalRecordCount: number;
  value: T[];
}

interface BatchResult {
  successRecords: DfRecord[];
  failureRecords: Array<{ error?: string; message?: string; record?: DfRecord }>;
}

/**
 * The Data Fabric API has shipped both PascalCase (`TotalRecordCount`, `Value`) and
 * camelCase (`totalRecordCount`, `value`) envelopes across releases, and the published
 * schema and prose disagree with each other. Rather than pin one and break on the other,
 * read whichever is present.
 */
function pick<T>(obj: Record<string, unknown>, ...names: string[]): T | undefined {
  for (const n of names) {
    if (obj[n] !== undefined) return obj[n] as T;
  }
  return undefined;
}

async function call<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  attempt = 0,
): Promise<T> {
  const url = `${dataFabricBase}${path}`;
  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (cause) {
    throw new UpstreamError(
      'Data Fabric was unreachable. The record was not written or read.',
      { cause, upstream: 'data-fabric' },
    );
  }

  // A cached-but-revoked token surfaces as 401. Re-mint once, then give up.
  if (res.status === 401 && attempt === 0) {
    logger.warn('Data Fabric returned 401 — re-minting token and retrying once');
    invalidateToken();
    return call<T>(method, path, body, attempt + 1);
  }

  const text = await res.text();

  if (!res.ok) {
    logger.error(
      { status: res.status, path, body: text.slice(0, 600) },
      'Data Fabric request failed',
    );
    const hint =
      res.status === 404
        ? ` The entity may not exist, or DATA_FABRIC_API_SEGMENT ("${env.DATA_FABRIC_API_SEGMENT}") may be wrong for this tenant — try "dataservice_/api".`
        : res.status === 403
          ? // Not a scope problem — if a scope were missing the token request itself would
            // fail. Data Fabric keeps its own role store (Administrator / Data Reader /
            // Data Writer / Designer) which the Authorization service cannot see, so an
            // External Application can hold every DataService.* scope and still be denied
            // here until it is granted one of those roles in Data Fabric's Manage Access.
            ' The caller authenticated but holds no Data Fabric role. OAuth scopes are not' +
            ' enough: grant the External Application "Data Reader" and "Data Writer" in' +
            " Data Fabric → Manage Access. Verify the token's scopes are unrelated to this."
          : '';
    throw new UpstreamError(`Data Fabric returned HTTP ${res.status}.${hint}`, {
      upstream: 'data-fabric',
      status: res.status,
      details: { body: text.slice(0, 600) },
    });
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new UpstreamError('Data Fabric returned a non-JSON body.', {
      cause,
      upstream: 'data-fabric',
    });
  }
}

export async function queryRecords<T = DfRecord>(
  entity: string,
  body: QueryBody,
): Promise<QueryResult<T>> {
  const raw = await call<Record<string, unknown>>(
    'POST',
    `/EntityService/${encodeURIComponent(entity)}/query`,
    body,
  );
  return {
    totalRecordCount: pick<number>(raw, 'totalRecordCount', 'TotalRecordCount') ?? 0,
    value: pick<T[]>(raw, 'value', 'Value') ?? [],
  };
}

export async function getRecordById<T = DfRecord>(
  entity: string,
  recordId: string,
  expansionLevel = 1,
): Promise<T | null> {
  try {
    const raw = await call<Record<string, unknown>>(
      'GET',
      `/EntityService/${encodeURIComponent(entity)}/query-by-id?recordId=${encodeURIComponent(recordId)}&expansionLevel=${expansionLevel}`,
    );
    if (!raw) return null;
    // Some releases wrap the record, others return it bare.
    const inner = pick<Record<string, unknown>>(raw, 'value', 'Value');
    return ((inner ?? raw) as T) ?? null;
  } catch (err) {
    if (err instanceof UpstreamError && (err.details as { upstreamStatus?: number })?.upstreamStatus === 404) {
      return null;
    }
    throw err;
  }
}

function assertBatchOk(result: BatchResult | undefined, operation: string): DfRecord[] {
  const failures = result?.failureRecords ?? [];
  if (failures.length > 0) {
    const first = failures[0];
    const detail = first?.error ?? first?.message ?? 'unknown reason';
    throw new UpstreamError(`Data Fabric rejected the ${operation}: ${detail}`, {
      upstream: 'data-fabric',
      details: { failureRecords: failures.slice(0, 5) },
    });
  }
  return result?.successRecords ?? [];
}

export async function insertRecords(entity: string, records: DfRecord[]): Promise<DfRecord[]> {
  if (records.length === 0) return [];
  const result = await call<BatchResult>(
    'POST',
    `/EntityService/${encodeURIComponent(entity)}/insert-batch?expansionLevel=1&failOnFirst=true`,
    records,
  );
  return assertBatchOk(result, 'insert');
}

export async function updateRecords(entity: string, records: DfRecord[]): Promise<DfRecord[]> {
  if (records.length === 0) return [];
  for (const r of records) {
    if (!r.Id) {
      throw new UpstreamError('Every record passed to update must include its system Id.', {
        upstream: 'data-fabric',
      });
    }
  }
  const result = await call<BatchResult>(
    'POST',
    `/EntityService/${encodeURIComponent(entity)}/update-batch?expansionLevel=1&failOnFirst=true`,
    records,
  );
  return assertBatchOk(result, 'update');
}

export async function deleteRecords(entity: string, recordIds: string[]): Promise<void> {
  if (recordIds.length === 0) return;
  await call<unknown>(
    'POST',
    `/EntityService/${encodeURIComponent(entity)}/delete-batch?failOnFirst=true`,
    recordIds,
  );
}

/** Single-record convenience wrappers. */
export async function insertRecord(entity: string, record: DfRecord): Promise<DfRecord> {
  const [created] = await insertRecords(entity, [record]);
  if (!created) {
    throw new UpstreamError('Data Fabric reported success but returned no created record.', {
      upstream: 'data-fabric',
    });
  }
  return created;
}

export async function updateRecord(entity: string, record: DfRecord): Promise<DfRecord> {
  const [updated] = await updateRecords(entity, [record]);
  if (!updated) {
    throw new UpstreamError('Data Fabric reported success but returned no updated record.', {
      upstream: 'data-fabric',
    });
  }
  return updated;
}

/** Convenience: fetch at most one record matching an equality filter. */
export async function findOneBy<T = DfRecord>(
  entity: string,
  fieldName: string,
  value: string,
): Promise<T | null> {
  const { value: rows } = await queryRecords<T>(entity, {
    filterGroup: { logicalOperator: 0, queryFilters: [{ fieldName, operator: '=', value }] },
    limit: 1,
  });
  return rows[0] ?? null;
}
