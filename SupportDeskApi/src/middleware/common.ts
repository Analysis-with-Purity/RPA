import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { AppError, ValidationError } from '../util/errors.js';
import { logger } from '../util/logger.js';
import { isProd } from '../config/env.js';

/** Wraps an async handler so a rejected promise reaches the error middleware. */
export function asyncHandler(
  fn: (...args: Parameters<RequestHandler>) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}

/** Parses and replaces `req.body` with the validated, transformed value. */
export function validateBody<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(zodToValidationError(parsed.error));
    req.body = parsed.data as z.infer<S>;
    next();
  };
}

/** Parses `req.query`. Express query values are strings, so schemas must coerce. */
export function validateQuery<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return next(zodToValidationError(parsed.error));
    // `req.query` has a getter-only type in Express 4 typings; cast through unknown.
    (req as unknown as { validatedQuery: unknown }).validatedQuery = parsed.data;
    next();
  };
}

/** Retrieves the value stashed by `validateQuery`. */
export function queryOf<T>(req: unknown): T {
  return (req as { validatedQuery: T }).validatedQuery;
}

function zodToValidationError(error: ZodError): ValidationError {
  const fieldErrors = error.issues.map((i) => ({
    field: i.path.join('.') || '(body)',
    message: i.message,
  }));
  return new ValidationError('Request validation failed.', { fieldErrors });
}

/**
 * Terminal error handler. Emits RFC7807-shaped problem details so a browser client can
 * render field-level messages without string-matching.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const reqId = (req as unknown as { id?: string }).id;

  if (err instanceof AppError) {
    // 5xx is ours; 4xx is the caller's. Only the former deserves an error-level log.
    const level = err.status >= 500 ? 'error' : 'warn';
    logger[level](
      { err, reqId, status: err.status, code: err.code, path: req.originalUrl },
      err.message,
    );
    res.status(err.status).json({
      type: `https://support-desk.api/errors/${err.code}`,
      title: err.message,
      status: err.status,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
      reqId,
    });
    return;
  }

  if (err instanceof ZodError) {
    const ve = zodToValidationError(err);
    res.status(ve.status).json({
      type: 'https://support-desk.api/errors/validation_error',
      title: ve.message,
      status: ve.status,
      code: ve.code,
      details: ve.details,
      reqId,
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      type: 'https://support-desk.api/errors/malformed_json',
      title: 'Request body is not valid JSON.',
      status: 400,
      code: 'malformed_json',
      reqId,
    });
    return;
  }

  logger.error({ err, reqId, path: req.originalUrl }, 'Unhandled error');
  res.status(500).json({
    type: 'https://support-desk.api/errors/internal_error',
    title: 'An unexpected error occurred.',
    status: 500,
    code: 'internal_error',
    ...(isProd ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    reqId,
  });
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    type: 'https://support-desk.api/errors/no_route',
    title: `No route for ${req.method} ${req.originalUrl}`,
    status: 404,
    code: 'no_route',
  });
};
