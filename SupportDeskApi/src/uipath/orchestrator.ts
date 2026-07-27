import { env, orchestratorBase } from '../config/env.js';
import { getAccessToken, invalidateToken } from './token.js';
import { logger } from '../util/logger.js';
import { ConflictError, UpstreamError } from '../util/errors.js';

/**
 * Orchestrator client, scoped to what the support desk needs: put work on the intake
 * queue and read back a transaction's fate.
 *
 * The folder header is mandatory on every queue call. `UIPATH_FOLDER_KEY` is preferred
 * because `X-UIPATH-FolderKey` accepts the GUID directly and avoids resolving a numeric
 * OrganizationUnitId per request.
 */

function folderHeaders(): Record<string, string> {
  return env.UIPATH_FOLDER_KEY
    ? { 'X-UIPATH-FolderKey': env.UIPATH_FOLDER_KEY }
    : { 'X-UIPATH-FolderPath': env.UIPATH_FOLDER_PATH };
}

async function call<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  attempt = 0,
): Promise<T> {
  const url = `${orchestratorBase}${path}`;
  const token = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
        ...folderHeaders(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (cause) {
    throw new UpstreamError('Orchestrator was unreachable. The ticket was not queued.', {
      cause,
      upstream: 'orchestrator',
    });
  }

  if (res.status === 401 && attempt === 0) {
    logger.warn('Orchestrator returned 401 — re-minting token and retrying once');
    invalidateToken();
    return call<T>(method, path, body, attempt + 1);
  }

  const text = await res.text();

  if (!res.ok) {
    logger.error(
      { status: res.status, path, body: text.slice(0, 600) },
      'Orchestrator request failed',
    );

    // The queue rejects a repeated Reference when EnforceUniqueReference is on. That is a
    // caller-visible duplicate, not an infrastructure fault.
    if (res.status === 409 || /unique reference/i.test(text)) {
      throw new ConflictError(
        'A queue item with this ticket reference already exists. The ticket was already submitted.',
        { upstreamStatus: res.status },
      );
    }

    const hint =
      res.status === 403
        ? ' The External Application lacks the OR.Queues scope, or has no access to the folder.'
        : res.status === 404
          ? ` Queue "${env.UIPATH_QUEUE_NAME}" may not exist in folder "${env.UIPATH_FOLDER_PATH}".`
          : '';
    throw new UpstreamError(`Orchestrator returned HTTP ${res.status}.${hint}`, {
      upstream: 'orchestrator',
      status: res.status,
      details: { body: text.slice(0, 600) },
    });
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new UpstreamError('Orchestrator returned a non-JSON body.', {
      cause,
      upstream: 'orchestrator',
    });
  }
}

export type QueuePriority = 'Low' | 'Normal' | 'High';

export interface AddQueueItemInput {
  /** Becomes the queue item Reference. Always the ticket id, so transactions correlate. */
  reference: string;
  priority: QueuePriority;
  /** Flat key-value payload the robot reads as SpecificContent. */
  specificContent: Record<string, string | number | boolean>;
}

export interface QueueItemResult {
  Id: number;
  Key: string;
  Status: string;
  Reference: string;
}

export async function addQueueItem(input: AddQueueItemInput): Promise<QueueItemResult> {
  return call<QueueItemResult>(
    'POST',
    '/odata/Queues/UiPathODataSvc.AddQueueItem',
    {
      itemData: {
        Name: env.UIPATH_QUEUE_NAME,
        Priority: input.priority,
        Reference: input.reference,
        SpecificContent: input.specificContent,
      },
    },
  );
}

export interface QueueItemState {
  Id: number;
  Reference: string;
  Status: string;
  ProcessingExceptionType?: string | null;
  ProcessingException?: { Reason?: string; Details?: string } | null;
  Output?: Record<string, unknown> | null;
}

/**
 * Reads the queue transaction for a reference. Used to tell a caller "your ticket is still
 * being processed" versus "intake failed" while no Data Fabric record exists yet.
 */
export async function getQueueItemByReference(
  reference: string,
): Promise<QueueItemState | null> {
  const filter = encodeURIComponent(`Reference eq '${reference.replace(/'/g, "''")}'`);
  const res = await call<{ value?: QueueItemState[] }>(
    'GET',
    `/odata/QueueItems?$filter=${filter}&$orderby=Id desc&$top=1`,
  );
  return res?.value?.[0] ?? null;
}

/** Liveness probe against Orchestrator, used by /api/health/upstream. */
export async function pingOrchestrator(): Promise<{ queueFound: boolean }> {
  const filter = encodeURIComponent(`Name eq '${env.UIPATH_QUEUE_NAME.replace(/'/g, "''")}'`);
  const res = await call<{ value?: Array<{ Name: string }> }>(
    'GET',
    `/odata/QueueDefinitions?$filter=${filter}&$top=1`,
  );
  return { queueFound: (res?.value?.length ?? 0) > 0 };
}
