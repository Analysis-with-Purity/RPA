/**
 * Error taxonomy. Mirrors the automation's split so a failure means the same thing on both
 * sides of the queue: business errors are the caller's data, upstream errors are ours.
 */

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    opts: { status?: number; code?: string; details?: unknown; cause?: unknown } = {},
  ) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = new.target.name;
    this.status = opts.status ?? 500;
    this.code = opts.code ?? 'internal_error';
    this.details = opts.details;
  }
}

/** 400 — the request body or query is wrong. */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { status: 400, code: 'validation_error', details });
  }
}

/** 401 — missing or invalid credentials. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, { status: 401, code: 'unauthorized' });
  }
}

/** 403 — authenticated but not permitted. */
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient role for this operation.') {
    super(message, { status: 403, code: 'forbidden' });
  }
}

/** 404 — no such ticket / comment / exception. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, { status: 404, code: 'not_found' });
  }
}

/** 409 — the request conflicts with current state (duplicate, illegal transition). */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { status: 409, code: 'conflict', details });
  }
}

/** 422 — well-formed but violates a business rule. */
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { status: 422, code: 'business_rule_violation', details });
  }
}

/** 502 — UiPath (Identity, Orchestrator or Data Fabric) failed or was unreachable. */
export class UpstreamError extends AppError {
  readonly upstream: string;

  constructor(
    message: string,
    opts: { cause?: unknown; upstream: string; status?: number; details?: unknown } = {
      upstream: 'uipath',
    },
  ) {
    // Fold the upstream HTTP status into details before calling super — `details` is
    // readonly once constructed, and callers rely on it to distinguish a 404 from a 503.
    const details = opts.status
      ? { ...(typeof opts.details === 'object' && opts.details ? opts.details : {}), upstreamStatus: opts.status }
      : opts.details;

    super(message, {
      status: 502,
      code: 'upstream_error',
      details,
      cause: opts.cause,
    });
    this.upstream = opts.upstream;
  }
}
