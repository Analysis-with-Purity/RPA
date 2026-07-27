import type { z } from 'zod';
import type { ExceptionSearchSchema } from '../domain/schemas.js';

/** Inferred request types shared between routes and services. */
export type ExceptionSearchInput = z.infer<typeof ExceptionSearchSchema>;
