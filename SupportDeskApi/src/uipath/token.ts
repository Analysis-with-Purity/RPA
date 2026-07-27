import { env, tokenEndpoint } from '../config/env.js';
import { logger } from '../util/logger.js';
import { UpstreamError } from '../util/errors.js';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface CachedToken {
  value: string;
  /** Epoch ms after which we refuse to reuse this token. */
  expiresAt: number;
}

/**
 * Client-credentials tokens live ~1 hour and carry no refresh token, so the only correct
 * strategy is cache-until-nearly-expired then re-mint.
 *
 * A single in-flight promise is shared by concurrent callers: under a burst of requests on
 * a cold cache we mint one token, not one per request.
 */
let cached: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

/** Re-mint this long before actual expiry, to survive clock skew and slow requests. */
const EXPIRY_SKEW_MS = 120_000;

async function mint(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.UIPATH_CLIENT_ID,
    client_secret: env.UIPATH_CLIENT_SECRET,
    scope: env.UIPATH_SCOPES,
  });

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    throw new UpstreamError('Could not reach the UiPath Identity token endpoint.', {
      cause,
      upstream: 'identity',
    });
  }

  const text = await res.text();

  if (!res.ok) {
    // The body can contain the client secret echoed back in some error shapes — log the
    // status and a trimmed body only, never the request body.
    logger.error(
      { status: res.status, body: text.slice(0, 400) },
      'UiPath token request rejected',
    );
    const hint =
      res.status === 400 && text.includes('scope')
        ? ' One or more requested scopes are not granted to this External Application. Copy the exact scope strings from Admin -> External Applications into UIPATH_SCOPES.'
        : res.status === 401
          ? ' Check UIPATH_CLIENT_ID and UIPATH_CLIENT_SECRET.'
          : '';
    throw new UpstreamError(`UiPath token request failed with HTTP ${res.status}.${hint}`, {
      upstream: 'identity',
      status: res.status,
    });
  }

  let parsed: TokenResponse;
  try {
    parsed = JSON.parse(text) as TokenResponse;
  } catch (cause) {
    throw new UpstreamError('UiPath token endpoint returned a non-JSON body.', {
      cause,
      upstream: 'identity',
    });
  }

  if (!parsed.access_token) {
    throw new UpstreamError('UiPath token response contained no access_token.', {
      upstream: 'identity',
    });
  }

  const ttlMs = (parsed.expires_in ?? 3600) * 1000;
  cached = {
    value: parsed.access_token,
    expiresAt: Date.now() + Math.max(ttlMs - EXPIRY_SKEW_MS, 30_000),
  };

  logger.info(
    { ttlSeconds: parsed.expires_in, elapsedMs: Date.now() - started, grantedScope: parsed.scope },
    'Minted UiPath access token',
  );

  return cached.value;
}

export async function getAccessToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.value;

  // Coalesce concurrent cold-cache callers onto one mint.
  inFlight ??= mint().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Drops the cached token so the next call re-mints. Used after a 401 from an API. */
export function invalidateToken(): void {
  cached = null;
}

export function tokenState(): { cached: boolean; expiresInSeconds: number | null } {
  if (!cached) return { cached: false, expiresInSeconds: null };
  return {
    cached: true,
    expiresInSeconds: Math.max(0, Math.round((cached.expiresAt - Date.now()) / 1000)),
  };
}
