/**
 * Transport for the Support Desk API (the Express service in `SupportDeskApi`).
 *
 * The console talks to it directly rather than proxying through Next route handlers — the
 * API already sets CORS and owns authentication, so a proxy would only add a hop and a
 * second place for the agent JWT to live.
 */

import type { Role } from "./catalog";

export const DESK_API_BASE = (
  process.env.NEXT_PUBLIC_SUPPORT_DESK_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

/** Field-level detail attached to a 400 from the API's zod validation. */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * A non-2xx response. The API answers in an RFC 7807-ish envelope
 * (`{ type, title, status, code, details, reqId }`), so `message` is already
 * human-readable — surface it directly rather than inventing our own wording.
 */
export class DeskApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly reqId?: string;

  constructor(opts: {
    message: string;
    status: number;
    code: string;
    details?: unknown;
    reqId?: string;
  }) {
    super(opts.message);
    this.name = "DeskApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.reqId = opts.reqId;
  }

  /** Validation errors carry a `fieldErrors` array; everything else returns []. */
  get fieldErrors(): FieldError[] {
    const d = this.details;
    if (d && typeof d === "object" && "fieldErrors" in d) {
      const fe = (d as { fieldErrors?: unknown }).fieldErrors;
      if (Array.isArray(fe)) {
        return fe.filter(
          (e): e is FieldError =>
            !!e && typeof e === "object" && "field" in e && "message" in e,
        );
      }
    }
    return [];
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

/**
 * Fired when any request comes back 401 so the session layer can clear the stored token and
 * bounce to sign-in, without every call site having to handle expiry itself.
 */
export const DESK_UNAUTHORIZED_EVENT = "desk-api:unauthorized";

function emitUnauthorized() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DESK_UNAUTHORIZED_EVENT));
  }
}

export interface DeskFetchOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Bearer token. Omit for the unauthenticated public/ops routes. */
  token?: string | null;
  /** Any plain object — interface types are accepted, not just index signatures. */
  query?: object;
  signal?: AbortSignal;
}

/**
 * Serialises a query object the way the API's zod schemas expect: arrays repeat the key
 * (`status=Assigned&status=Resolved`), booleans go through as `true`/`false`, and
 * undefined/null/"" are dropped so an empty filter never narrows the search.
 */
export function buildQuery(query: object | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query) as Array<[string, unknown]>) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined && v !== null && v !== "") params.append(key, String(v));
      }
    } else {
      params.append(key, String(value));
    }
  }

  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function deskFetch<T>(path: string, options: DeskFetchOptions = {}): Promise<T> {
  const { method = "GET", body, token, query, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${DESK_API_BASE}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // fetch only rejects on network-level failure, which for this app almost always means
    // the API is not running or CORS blocked the call — say so rather than "Failed to fetch".
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new DeskApiError({
      message: `Could not reach the Support Desk API at ${DESK_API_BASE}. Check that it is running and that CORS_ORIGINS allows this origin.`,
      status: 0,
      code: "network_error",
    });
  }

  if (res.status === 204) return undefined as T;

  const payload: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) emitUnauthorized();

    const p = (payload ?? {}) as Record<string, unknown>;
    throw new DeskApiError({
      message:
        typeof p.title === "string" && p.title
          ? p.title
          : `Request failed with status ${res.status}.`,
      status: res.status,
      code: typeof p.code === "string" ? p.code : "unknown_error",
      details: p.details,
      reqId: typeof p.reqId === "string" ? p.reqId : undefined,
    });
  }

  return payload as T;
}

// ------------------------------------------------------------------ dev tokens

/**
 * Mints an agent JWT via `POST /api/auth/dev-token`.
 *
 * The API refuses this route when it runs with NODE_ENV=production, where tokens must come
 * from the real identity provider instead. The sign-in page surfaces that 403 as-is.
 */
export function requestDevToken(input: { subject: string; name?: string; roles: Role[] }) {
  return deskFetch<{
    tokenType: "Bearer";
    accessToken: string;
    expiresIn: number;
    roles: Role[];
  }>("/api/auth/dev-token", { method: "POST", body: input });
}
