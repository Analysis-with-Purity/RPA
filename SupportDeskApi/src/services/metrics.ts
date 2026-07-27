import { env } from '../config/env.js';
import { OPEN_STATUSES, PRIORITIES, STATUSES } from '../config/catalog.js';
import { toTicketDto } from '../domain/ticket.js';
import { queryRecords, type DfRecord, type FilterGroup } from '../uipath/dataFabric.js';

const TICKET = env.ENTITY_TICKET;
const EXCEPTION = env.ENTITY_EXCEPTION;

/**
 * Data Fabric's query endpoint returns rows, not server-side aggregates, so counts are
 * derived by fetching a bounded window and reducing in memory.
 *
 * `SAMPLE_LIMIT` is the platform's per-query maximum. Every response reports `sampled` and
 * `truncated` so a dashboard can never silently present a partial figure as a total.
 */
const SAMPLE_LIMIT = 1000;

function countBy<T extends string>(values: (string | null)[], keys: readonly T[]): Record<T, number> {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
  for (const v of values) {
    if (v && (keys as readonly string[]).includes(v)) out[v as T] += 1;
  }
  return out;
}

async function fetchWindow(filterGroup?: FilterGroup): Promise<{
  rows: DfRecord[];
  total: number;
  truncated: boolean;
}> {
  const res = await queryRecords<DfRecord>(TICKET, {
    ...(filterGroup ? { filterGroup } : {}),
    limit: SAMPLE_LIMIT,
    sortOptions: [{ fieldName: 'CreatedDate', isDescending: true }],
  });
  return {
    rows: res.value,
    total: res.totalRecordCount,
    truncated: res.totalRecordCount > res.value.length,
  };
}

export interface SummaryMetrics {
  generatedAt: string;
  totalTickets: number;
  sampled: number;
  truncated: boolean;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byAssignmentGroup: Record<string, number>;
  open: number;
  unassigned: number;
  breached: number;
  refunds: { requested: number; approved: number; processed: number; rejected: number; totalApprovedValue: number };
  csat: { responses: number; average: number | null };
}

export async function summary(sinceIso?: string): Promise<SummaryMetrics> {
  const filterGroup: FilterGroup | undefined = sinceIso
    ? {
        logicalOperator: 0,
        queryFilters: [
          { fieldName: 'CreatedDate', operator: '>=', value: new Date(sinceIso).toISOString() },
        ],
      }
    : undefined;

  const { rows, total, truncated } = await fetchWindow(filterGroup);
  const tickets = rows.map((r) => toTicketDto(r));

  const byCategory: Record<string, number> = {};
  const byGroup: Record<string, number> = {};
  let csatSum = 0;
  let csatCount = 0;
  let approvedValue = 0;
  const refunds = { requested: 0, approved: 0, processed: 0, rejected: 0 };

  for (const t of tickets) {
    const cat = t.category ?? '(uncategorised)';
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    const grp = t.assignment.group ?? '(unassigned group)';
    byGroup[grp] = (byGroup[grp] ?? 0) + 1;

    if (t.resolution.csatScore !== null) {
      csatSum += t.resolution.csatScore;
      csatCount += 1;
    }
    switch (t.refund.status) {
      case 'Requested':
        refunds.requested += 1;
        break;
      case 'Approved':
        refunds.approved += 1;
        approvedValue += t.refund.amount ?? 0;
        break;
      case 'Processed':
        refunds.processed += 1;
        approvedValue += t.refund.amount ?? 0;
        break;
      case 'Rejected':
        refunds.rejected += 1;
        break;
      default:
        break;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalTickets: total,
    sampled: tickets.length,
    truncated,
    byStatus: countBy(tickets.map((t) => t.status), STATUSES),
    byPriority: countBy(tickets.map((t) => t.priority), PRIORITIES),
    byCategory,
    byAssignmentGroup: byGroup,
    open: tickets.filter((t) => OPEN_STATUSES.includes(t.status)).length,
    unassigned: tickets.filter((t) => t.status === 'Not Assigned').length,
    breached: tickets.filter((t) => t.sla.anyBreach).length,
    refunds: { ...refunds, totalApprovedValue: Number(approvedValue.toFixed(2)) },
    csat: {
      responses: csatCount,
      average: csatCount ? Number((csatSum / csatCount).toFixed(2)) : null,
    },
  };
}

export interface SlaReport {
  generatedAt: string;
  sampled: number;
  truncated: boolean;
  openTickets: number;
  firstResponseBreached: number;
  resolutionBreached: number;
  dueWithin2Hours: number;
  noSlaApplied: number;
  worstOffenders: Array<{
    ticketId: string;
    priority: string | null;
    status: string;
    category: string | null;
    minutesOverdue: number;
    assignedAgentEmail: string | null;
  }>;
}

export async function slaReport(): Promise<SlaReport> {
  const { rows, truncated } = await fetchWindow({
    logicalOperator: 1,
    queryFilters: OPEN_STATUSES.map((s) => ({ fieldName: 'Status', operator: '=', value: s })),
  });

  const tickets = rows.map((r) => toTicketDto(r));
  const overdue = tickets
    .filter((t) => t.sla.minutesToResolutionDue !== null && t.sla.minutesToResolutionDue < 0)
    .map((t) => ({
      ticketId: t.ticketId,
      priority: t.priority,
      status: t.status,
      category: t.category,
      minutesOverdue: Math.abs(t.sla.minutesToResolutionDue ?? 0),
      assignedAgentEmail: t.assignment.agentEmail,
    }))
    .sort((a, b) => b.minutesOverdue - a.minutesOverdue)
    .slice(0, 20);

  return {
    generatedAt: new Date().toISOString(),
    sampled: tickets.length,
    truncated,
    openTickets: tickets.length,
    firstResponseBreached: tickets.filter((t) => t.sla.firstResponseBreached).length,
    resolutionBreached: tickets.filter((t) => t.sla.resolutionBreached).length,
    dueWithin2Hours: tickets.filter(
      (t) =>
        t.sla.minutesToResolutionDue !== null &&
        t.sla.minutesToResolutionDue >= 0 &&
        t.sla.minutesToResolutionDue <= 120,
    ).length,
    noSlaApplied: tickets.filter((t) => t.sla.resolutionDue === null).length,
    worstOffenders: overdue,
  };
}

export interface AgentWorkload {
  generatedAt: string;
  sampled: number;
  agents: Array<{
    agentEmail: string;
    agentName: string | null;
    open: number;
    breached: number;
    byStatus: Record<string, number>;
  }>;
  unassigned: number;
}

export async function agentWorkload(): Promise<AgentWorkload> {
  const { rows } = await fetchWindow({
    logicalOperator: 1,
    queryFilters: OPEN_STATUSES.map((s) => ({ fieldName: 'Status', operator: '=', value: s })),
  });
  const tickets = rows.map((r) => toTicketDto(r));

  const buckets = new Map<
    string,
    { agentName: string | null; open: number; breached: number; byStatus: Record<string, number> }
  >();
  let unassigned = 0;

  for (const t of tickets) {
    const email = t.assignment.agentEmail;
    if (!email) {
      unassigned += 1;
      continue;
    }
    const b =
      buckets.get(email) ??
      { agentName: t.assignment.agent, open: 0, breached: 0, byStatus: {} };
    b.open += 1;
    if (t.sla.anyBreach) b.breached += 1;
    b.byStatus[t.status] = (b.byStatus[t.status] ?? 0) + 1;
    buckets.set(email, b);
  }

  return {
    generatedAt: new Date().toISOString(),
    sampled: tickets.length,
    agents: [...buckets.entries()]
      .map(([agentEmail, v]) => ({ agentEmail, ...v }))
      .sort((a, b) => b.open - a.open),
    unassigned,
  };
}

/** Batch-code rollup — the view a recall or adverse-event investigation starts from. */
export interface BatchReport {
  generatedAt: string;
  sampled: number;
  batches: Array<{
    batchCode: string;
    total: number;
    productNames: string[];
    categories: string[];
    safetyReports: number;
    authenticityReports: number;
    openTickets: number;
  }>;
}

export async function batchReport(): Promise<BatchReport> {
  const { rows } = await fetchWindow({
    logicalOperator: 0,
    queryFilters: [{ fieldName: 'BatchCode', operator: 'not empty', value: null }],
  });
  const tickets = rows.map((r) => toTicketDto(r));

  const map = new Map<
    string,
    {
      total: number;
      productNames: Set<string>;
      categories: Set<string>;
      safetyReports: number;
      authenticityReports: number;
      openTickets: number;
    }
  >();

  for (const t of tickets) {
    const code = t.commerce.batchCode;
    if (!code) continue;
    const b =
      map.get(code) ??
      {
        total: 0,
        productNames: new Set<string>(),
        categories: new Set<string>(),
        safetyReports: 0,
        authenticityReports: 0,
        openTickets: 0,
      };
    b.total += 1;
    if (t.commerce.productName) b.productNames.add(t.commerce.productName);
    if (t.category) b.categories.add(t.category);
    if (t.category === 'Health & Safety') b.safetyReports += 1;
    if (t.category === 'Authenticity') b.authenticityReports += 1;
    if (OPEN_STATUSES.includes(t.status)) b.openTickets += 1;
    map.set(code, b);
  }

  return {
    generatedAt: new Date().toISOString(),
    sampled: tickets.length,
    batches: [...map.entries()]
      .map(([batchCode, v]) => ({
        batchCode,
        total: v.total,
        productNames: [...v.productNames],
        categories: [...v.categories],
        safetyReports: v.safetyReports,
        authenticityReports: v.authenticityReports,
        openTickets: v.openTickets,
      }))
      // Safety first, then volume — this list is read during an incident.
      .sort((a, b) => b.safetyReports - a.safetyReports || b.total - a.total),
  };
}

/** Intake health: how many submissions the automation failed to turn into records. */
export async function intakeHealth(): Promise<{
  generatedAt: string;
  totalFailures: number;
  unresolved: number;
  byReason: Record<string, number>;
  byType: Record<string, number>;
}> {
  const res = await queryRecords<DfRecord>(EXCEPTION, {
    limit: SAMPLE_LIMIT,
    sortOptions: [{ fieldName: 'OccurredAt', isDescending: true }],
  });

  const byReason: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let unresolved = 0;

  for (const r of res.value) {
    const reason = String(r.ExceptionReason ?? 'Unknown');
    const type = String(r.ExceptionType ?? 'Unknown');
    byReason[reason] = (byReason[reason] ?? 0) + 1;
    byType[type] = (byType[type] ?? 0) + 1;
    if (r.Resolved !== true && r.Resolved !== 'true') unresolved += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    totalFailures: res.totalRecordCount,
    unresolved,
    byReason,
    byType,
  };
}
