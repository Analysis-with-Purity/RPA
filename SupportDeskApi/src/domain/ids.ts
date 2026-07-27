import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

/** Crockford base32 — no I, L, O or U, so ids are safe to read aloud to a customer. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function base32(byteLength: number): string {
  const bytes = randomBytes(byteLength);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/**
 * Ticket ids are generated here, not by Data Fabric, because the id must be returned to the
 * browser synchronously while the record itself is written asynchronously by the robot.
 *
 * Format: `TCK-<6 time chars><5 random chars>`. The time prefix makes ids roughly sortable
 * and keeps support conversations chronological; the random suffix prevents guessing a
 * neighbour's ticket id. `TicketId` is unique-constrained in Data Fabric, so in the
 * astronomically unlikely event of a collision the automation raises DuplicateTicket rather
 * than overwriting anything.
 */
export function generateTicketId(now: Date = new Date()): string {
  // Base32 of the epoch in seconds, padded to 6 chars (good until year ~2081).
  let seconds = Math.floor(now.getTime() / 1000);
  let timePart = '';
  for (let i = 0; i < 6; i++) {
    timePart = ALPHABET[seconds % 32] + timePart;
    seconds = Math.floor(seconds / 32);
  }
  return `${env.TICKET_ID_PREFIX}-${timePart}${base32(5)}`;
}

/**
 * Opaque token letting an anonymous customer re-open their own ticket status page without
 * an account. Derived from randomness only — it is a bearer secret, never derived from the
 * ticket id, so knowing one ticket id does not grant access to another.
 */
export function generateLookupToken(): string {
  return base32(20);
}

export function generateTicketNumber(sequenceHint: number = Date.now() % 1_000_000): string {
  return `SR-${String(sequenceHint).padStart(6, '0')}`;
}
