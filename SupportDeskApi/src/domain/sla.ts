import { SLA_POLICIES, type Priority, type TicketStatus } from '../config/catalog.js';

export interface SlaPlan {
  slaPolicy: string;
  firstResponseDueDate: string;
  resolutionDueDate: string;
}

function addMinutes(from: Date, minutes: number): string {
  return new Date(from.getTime() + minutes * 60_000).toISOString();
}

/**
 * SLA clocks start at ticket creation, not at assignment — a ticket sitting unassigned is
 * exactly the situation an SLA is meant to expose.
 */
export function planSla(priority: Priority, createdAt: Date = new Date()): SlaPlan {
  const policy = SLA_POLICIES[priority];
  return {
    slaPolicy: policy.name,
    firstResponseDueDate: addMinutes(createdAt, policy.firstResponseMinutes),
    resolutionDueDate: addMinutes(createdAt, policy.resolutionMinutes),
  };
}

export interface SlaState {
  firstResponseDue: string | null;
  firstResponseAt: string | null;
  firstResponseBreached: boolean;
  resolutionDue: string | null;
  resolvedAt: string | null;
  resolutionBreached: boolean;
  /** Minutes until the resolution deadline. Negative once overdue. */
  minutesToResolutionDue: number | null;
  anyBreach: boolean;
}

const TERMINAL: TicketStatus[] = ['Resolved', 'Closed', 'Cancelled'];

/**
 * Breach is computed on read rather than trusted from a stored flag, so a ticket that went
 * overdue while nothing was running still reports correctly. The stored `SlaBreached` column
 * remains the SLA-monitoring workflow's to own.
 */
export function evaluateSla(
  record: {
    FirstResponseDueDate?: string | null;
    FirstResponseDate?: string | null;
    ResolutionDueDate?: string | null;
    ResolutionDate?: string | null;
    Status?: string | null;
  },
  now: Date = new Date(),
): SlaState {
  const frDue = record.FirstResponseDueDate ?? null;
  const frAt = record.FirstResponseDate ?? null;
  const resDue = record.ResolutionDueDate ?? null;
  const resAt = record.ResolutionDate ?? null;
  const isTerminal = TERMINAL.includes((record.Status ?? '') as TicketStatus);

  const frBreached = frDue
    ? frAt
      ? new Date(frAt) > new Date(frDue)
      : now > new Date(frDue)
    : false;

  const resBreached = resDue
    ? resAt
      ? new Date(resAt) > new Date(resDue)
      : !isTerminal && now > new Date(resDue)
    : false;

  const minutesToResolutionDue = resDue
    ? Math.round((new Date(resDue).getTime() - now.getTime()) / 60_000)
    : null;

  return {
    firstResponseDue: frDue,
    firstResponseAt: frAt,
    firstResponseBreached: frBreached,
    resolutionDue: resDue,
    resolvedAt: resAt,
    resolutionBreached: resBreached,
    minutesToResolutionDue,
    anyBreach: frBreached || resBreached,
  };
}
