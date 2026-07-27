import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../util/errors.js';

export type Role = 'agent' | 'supervisor' | 'admin';

export interface Principal {
  subject: string;
  name?: string;
  roles: Role[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

interface AgentClaims extends jwt.JwtPayload {
  sub: string;
  name?: string;
  roles?: Role[];
}

export function signAgentToken(input: {
  subject: string;
  name?: string;
  roles: Role[];
}): { token: string; expiresIn: number } {
  const token = jwt.sign(
    { name: input.name, roles: input.roles },
    env.JWT_SECRET,
    {
      subject: input.subject,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: env.JWT_TTL_SECONDS,
      algorithm: 'HS256',
    },
  );
  return { token, expiresIn: env.JWT_TTL_SECONDS };
}

function readBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) return null;
  return value.trim();
}

/**
 * Verifies the agent JWT and attaches the principal. Algorithm is pinned to HS256 so a
 * token presented with `alg: none` — or an RS256 token signed with a key we do not
 * control — is rejected outright.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = readBearer(req);
  if (!token) return next(new UnauthorizedError('Bearer token required.'));

  try {
    const claims = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as AgentClaims;

    if (!claims.sub) return next(new UnauthorizedError('Token has no subject.'));

    req.principal = {
      subject: claims.sub,
      name: claims.name,
      roles: claims.roles ?? [],
    };
    return next();
  } catch (err) {
    const message =
      err instanceof jwt.TokenExpiredError
        ? 'Token has expired.'
        : err instanceof jwt.JsonWebTokenError
          ? 'Token is invalid.'
          : 'Token could not be verified.';
    return next(new UnauthorizedError(message));
  }
};

/** Requires at least one of the given roles. `admin` satisfies every requirement. */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const roles = req.principal?.roles ?? [];
    if (roles.includes('admin') || allowed.some((r) => roles.includes(r))) return next();
    return next(
      new ForbiddenError(
        `This operation requires one of: ${allowed.join(', ')}. Token carries: ${roles.join(', ') || 'none'}.`,
      ),
    );
  };
}

/** Convenience: the acting agent's display identity, for audit fields and comment authorship. */
export function actorOf(req: Request): { name: string; email: string } {
  const p = req.principal;
  return {
    name: p?.name ?? p?.subject ?? 'Unknown agent',
    email: p?.subject ?? 'unknown@localhost',
  };
}
