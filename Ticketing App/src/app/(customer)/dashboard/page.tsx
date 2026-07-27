"use client";

import {
  ClockIcon,
  HeartHandshakeIcon,
  InboxIcon,
  TicketIcon,
} from "lucide-react";

import { useDashboardStats } from "@/lib/query/useDashboardStats";
import { useTickets } from "@/lib/query/useTickets";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { TicketVolumeChart } from "@/components/dashboard/TicketVolumeChart";
import { SatisfactionScoreCard } from "@/components/dashboard/SatisfactionScoreCard";
import { RecentTicketsWidget } from "@/components/dashboard/RecentTicketsWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const statsQuery = useDashboardStats();
  const recentTicketsQuery = useTickets({ sort: "newest" });

  const isLoading = statsQuery.isLoading || recentTicketsQuery.isLoading;
  const isError = statsQuery.isError || recentTicketsQuery.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="An overview of your support activity."
      />

      {isLoading && <DashboardSkeleton />}

      {isError && !isLoading && (
        <ErrorState
          onRetry={() => {
            statsQuery.refetch();
            recentTicketsQuery.refetch();
          }}
        />
      )}

      {!isLoading && !isError && statsQuery.data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Open tickets"
              value={String(statsQuery.data.openCount)}
              icon={InboxIcon}
              hint="Submitted, assigned & in progress"
            />
            <StatCard
              label="Pending on you"
              value={String(statsQuery.data.pendingCount)}
              icon={ClockIcon}
              hint="Awaiting your reply"
            />
            <StatCard
              label="Resolved"
              value={String(statsQuery.data.resolvedCount)}
              icon={TicketIcon}
              hint="Resolved & closed"
            />
            <StatCard
              label="Avg. first response"
              value={`${statsQuery.data.avgResponseTimeHours}h`}
              icon={HeartHandshakeIcon}
              hint={`Avg. resolution ${statsQuery.data.avgResolutionTimeHours}h`}
              tone="accent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ticket volume, last 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <TicketVolumeChart data={statsQuery.data.ticketVolumeTrend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction score</CardTitle>
              </CardHeader>
              <CardContent>
                <SatisfactionScoreCard score={statsQuery.data.satisfactionScore} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTicketsQuery.data && recentTicketsQuery.data.length > 0 ? (
                <RecentTicketsWidget tickets={recentTicketsQuery.data.slice(0, 6)} />
              ) : (
                <EmptyState
                  icon={TicketIcon}
                  title="No tickets yet"
                  description="Tickets you submit will show up here."
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
