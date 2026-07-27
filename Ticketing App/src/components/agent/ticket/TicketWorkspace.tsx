"use client";

import Link from "next/link";
import { ChevronLeftIcon, PaperclipIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { PriorityBadge, SlaBadge, StatusBadge } from "@/components/agent/badges";
import { RefundCard } from "@/components/agent/ticket/RefundCard";
import { TicketActions } from "@/components/agent/ticket/TicketActions";
import { TicketDetailsPanel } from "@/components/agent/ticket/TicketDetailsPanel";
import { TicketThread } from "@/components/agent/ticket/TicketThread";
import { ErrorState } from "@/components/shared/ErrorState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { deskErrorMessage, useTicket } from "@/lib/agent-api/hooks";
import { DeskApiError } from "@/lib/agent-api/client";

const TERMINAL = new Set(["Resolved", "Closed", "Cancelled"]);

export function TicketWorkspace({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, isError, error, refetch, isFetching } = useTicket(ticketId);

  if (isLoading) return <WorkspaceSkeleton />;

  if (isError || !ticket) {
    const notFound = error instanceof DeskApiError && error.status === 404;
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          title={notFound ? "No such ticket" : "Could not load this ticket"}
          description={
            notFound
              ? `Nothing in Data Fabric has the id "${ticketId}". It may still be in the intake queue, or the id may be mistyped.`
              : deskErrorMessage(error)
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const terminal = TERMINAL.has(ticket.status);

  return (
    <div className="space-y-4">
      <BackLink />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {ticket.ticketNumber ?? ticket.ticketId}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SlaBadge
              minutesToDue={ticket.sla.minutesToResolutionDue}
              breached={ticket.sla.resolutionBreached}
              terminal={terminal}
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {[ticket.category, ticket.subcategory].filter(Boolean).join(" · ") ||
              "Uncategorised"}
            {ticket.assignment.group ? ` — ${ticket.assignment.group}` : ""}
            {ticket.assignment.agent ? ` · ${ticket.assignment.agent}` : " · unassigned"}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCwIcon className={isFetching ? "size-4 animate-spin" : "size-4"} />
          Refresh
        </Button>
      </div>

      {ticket.sla.anyBreach && !terminal && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>SLA breached</AlertTitle>
          <AlertDescription>
            {ticket.sla.firstResponseBreached && !ticket.sla.firstResponseAt
              ? "The customer has not had a first response in time. "
              : ""}
            {ticket.sla.resolutionBreached
              ? "This ticket is past its resolution deadline."
              : ""}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What the customer reported</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>

              {ticket.attachmentReferences.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                  {ticket.attachmentReferences.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <PaperclipIcon className="size-3.5" />
                      {url.split("/").pop() ?? "attachment"}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <TicketThread ticket={ticket} />
        </div>

        <div className="space-y-4">
          <TicketActions ticket={ticket} />
          <RefundCard ticket={ticket} />
          <TicketDetailsPanel ticket={ticket} />
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/agent/queue"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeftIcon className="size-4" />
      Back to queue
    </Link>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-8 w-96" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
