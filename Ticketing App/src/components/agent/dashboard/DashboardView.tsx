"use client";

import Link from "next/link";
import {
  ActivityIcon,
  CircleAlertIcon,
  InboxIcon,
  RefreshCwIcon,
  StarIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";

import { CountBarChart, type CountDatum } from "@/components/agent/dashboard/CountBarChart";
import { formatMinutes } from "@/components/agent/badges";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIORITIES, STATUSES } from "@/lib/agent-api/catalog";
import {
  deskErrorMessage,
  useAgentWorkload,
  useSlaReport,
  useSummaryMetrics,
} from "@/lib/agent-api/hooks";
import type { SummaryMetrics } from "@/lib/agent-api/types";

export function DashboardView() {
  const summary = useSummaryMetrics();
  const sla = useSlaReport();
  const workload = useAgentWorkload();

  const isFetching = summary.isFetching || sla.isFetching || workload.isFetching;

  function refreshAll() {
    void summary.refetch();
    void sla.refetch();
    void workload.refetch();
  }

  if (summary.isError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState
          title="Could not load metrics"
          description={deskErrorMessage(summary.error)}
          onRetry={() => void summary.refetch()}
        />
      </>
    );
  }

  const data = summary.data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Queue health, SLA position and who is carrying the load."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={refreshAll}
            disabled={isFetching}
          >
            <RefreshCwIcon className={isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      {data?.truncated && <TruncationNotice data={data} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Open tickets"
          value={data?.open}
          hint="Not Assigned, Assigned, In Progress or Waiting"
          icon={InboxIcon}
          loading={summary.isLoading}
        />
        <StatTile
          label="Unassigned"
          value={data?.unassigned}
          hint="Nobody has picked these up"
          icon={UserIcon}
          loading={summary.isLoading}
          tone={data && data.unassigned > 0 ? "warning" : undefined}
        />
        <StatTile
          label="SLA breached"
          value={data?.breached}
          hint="Past first-response or resolution deadline"
          icon={TriangleAlertIcon}
          loading={summary.isLoading}
          tone={data && data.breached > 0 ? "critical" : undefined}
        />
        <StatTile
          label="CSAT"
          value={data?.csat.average ?? undefined}
          suffix={data?.csat.average != null ? " / 5" : undefined}
          hint={
            data ? `${data.csat.responses} ${data.csat.responses === 1 ? "response" : "responses"}` : undefined
          }
          icon={StarIcon}
          loading={summary.isLoading}
          emptyLabel="No ratings yet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets by status</CardTitle>
            <CardDescription>
              Where the {data ? data.sampled.toLocaleString() : ""} sampled tickets sit in
              the lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <CountBarChart data={toOrderedData(data?.byStatus, STATUSES)} height={260} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tickets by priority</CardTitle>
            <CardDescription>
              Category floors mean a Health &amp; Safety report is always Urgent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <CountBarChart data={toOrderedData(data?.byPriority, PRIORITIES)} height={260} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top categories</CardTitle>
            <CardDescription>What customers are actually contacting us about.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <CountBarChart data={topN(data?.byCategory, 8)} height={280} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignment groups</CardTitle>
            <CardDescription>Routing spread across the desk.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.isLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <CountBarChart data={topN(data?.byAssignmentGroup, 8)} height={280} />
            )}
          </CardContent>
        </Card>
      </div>

      <SlaSection />
      <WorkloadSection />
      <RefundSummary data={data} loading={summary.isLoading} />
    </>
  );
}

/**
 * The API aggregates over a bounded 1000-row window, so a large desk sees partial figures.
 * Saying so is not optional — an unlabelled sample reads as a total.
 */
function TruncationNotice({ data }: { data: SummaryMetrics }) {
  return (
    <Alert variant="warning">
      <CircleAlertIcon />
      <AlertTitle>Figures cover a sample, not the whole desk</AlertTitle>
      <AlertDescription>
        The API aggregates the most recent {data.sampled.toLocaleString()} of{" "}
        {data.totalTickets.toLocaleString()} tickets. Counts and averages below describe that
        window only.
      </AlertDescription>
    </Alert>
  );
}

function SlaSection() {
  const { data, isLoading, isError, error, refetch } = useSlaReport();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SLA</CardTitle>
        <CardDescription>Open tickets measured against their deadlines.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <ErrorState
            title="Could not load the SLA report"
            description={deskErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Open" value={data.openTickets} />
              <MiniStat
                label="First response late"
                value={data.firstResponseBreached}
                tone={data.firstResponseBreached > 0 ? "critical" : undefined}
              />
              <MiniStat
                label="Resolution overdue"
                value={data.resolutionBreached}
                tone={data.resolutionBreached > 0 ? "critical" : undefined}
              />
              <MiniStat
                label="Due within 2h"
                value={data.dueWithin2Hours}
                tone={data.dueWithin2Hours > 0 ? "warning" : undefined}
              />
            </div>

            {data.worstOffenders.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[40rem] text-sm">
                  <caption className="sr-only">Tickets furthest past their deadline</caption>
                  <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Ticket</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Category</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Status</th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">Owner</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.worstOffenders.slice(0, 10).map((row) => (
                      <tr key={row.ticketId} className="hover:bg-muted/40">
                        <td className="px-3 py-2">
                          <Link
                            href={`/agent/tickets/${encodeURIComponent(row.ticketId)}`}
                            className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                          >
                            {row.ticketId}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{row.category ?? "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.status}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.assignedAgentEmail ?? "Unassigned"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-destructive tabular-nums">
                          {formatMinutes(row.minutesOverdue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.noSlaApplied > 0 && (
              <p className="text-xs text-muted-foreground">
                {data.noSlaApplied} open{" "}
                {data.noSlaApplied === 1 ? "ticket has" : "tickets have"} no SLA applied.
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function WorkloadSection() {
  const { data, isLoading, isError, error, refetch } = useAgentWorkload();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ActivityIcon className="size-4" />
          Agent workload
        </CardTitle>
        <CardDescription>Open tickets per agent, breached count alongside.</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            title="Could not load workload"
            description={deskErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !data || data.agents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No open tickets are assigned to anyone right now.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium">Agent</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Open</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Breached</th>
                    <th scope="col" className="px-3 py-2 text-left font-medium">Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.agents.map((agent) => (
                    <tr key={agent.agentEmail} className="hover:bg-muted/40">
                      <td className="px-3 py-2">
                        <Link
                          href={`/agent/queue?preset=all&assignedAgentEmail=${encodeURIComponent(agent.agentEmail)}`}
                          className="underline-offset-4 hover:text-primary hover:underline"
                        >
                          <span className="font-medium">{agent.agentName ?? agent.agentEmail}</span>
                          {agent.agentName && (
                            <span className="block text-xs text-muted-foreground">
                              {agent.agentEmail}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{agent.open}</td>
                      <td
                        className={
                          agent.breached > 0
                            ? "px-3 py-2 text-right font-medium text-destructive tabular-nums"
                            : "px-3 py-2 text-right text-muted-foreground tabular-nums"
                        }
                      >
                        {agent.breached}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {Object.entries(agent.byStatus)
                          .map(([status, count]) => `${status} ${count}`)
                          .join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.unassigned > 0 && (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/agent/queue?preset=unassigned"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {data.unassigned} open {data.unassigned === 1 ? "ticket is" : "tickets are"}{" "}
                  unassigned
                </Link>
                .
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RefundSummary({
  data,
  loading,
}: {
  data: SummaryMetrics | undefined;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-28 w-full rounded-xl" />;
  if (!data) return null;

  const { requested, approved, processed, rejected, totalApprovedValue } = data.refunds;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Refunds</CardTitle>
        <CardDescription>
          {totalApprovedValue.toFixed(2)} approved or already paid across the sample.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-4">
        <MiniStat
          label="Awaiting decision"
          value={requested}
          tone={requested > 0 ? "warning" : undefined}
        />
        <MiniStat label="Approved" value={approved} />
        <MiniStat label="Processed" value={processed} />
        <MiniStat label="Rejected" value={rejected} />
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------------- primitives

function StatTile({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  loading,
  tone,
  emptyLabel = "—",
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  hint?: string;
  icon: typeof InboxIcon;
  loading: boolean;
  tone?: "warning" | "critical";
  emptyLabel?: string;
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="flex items-start justify-between gap-4 px-5">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p
              className={
                tone === "critical"
                  ? "text-2xl font-semibold tracking-tight text-destructive"
                  : tone === "warning"
                    ? "text-2xl font-semibold tracking-tight text-warning"
                    : "text-2xl font-semibold tracking-tight"
              }
            >
              {value === undefined ? emptyLabel : `${value.toLocaleString()}${suffix ?? ""}`}
            </p>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warning" | "critical";
}) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "critical"
            ? "text-xl font-semibold text-destructive tabular-nums"
            : tone === "warning"
              ? "text-xl font-semibold text-warning tabular-nums"
              : "text-xl font-semibold tabular-nums"
        }
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ------------------------------------------------------------------------ shaping

/** Keeps the lifecycle in its real order rather than sorting by size. */
function toOrderedData(
  counts: Record<string, number> | undefined,
  order: readonly string[],
): CountDatum[] {
  if (!counts) return [];
  return order
    .map((name) => ({ name, value: counts[name] ?? 0 }))
    .filter((d) => d.value > 0);
}

/** Free-text dimensions have no natural order, so rank them and cap the tail. */
function topN(counts: Record<string, number> | undefined, n: number): CountDatum[] {
  if (!counts) return [];
  const sorted = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= n) return sorted;

  const head = sorted.slice(0, n);
  const tail = sorted.slice(n).reduce((sum, d) => sum + d.value, 0);
  return tail > 0 ? [...head, { name: `Other (${sorted.length - n})`, value: tail }] : head;
}
