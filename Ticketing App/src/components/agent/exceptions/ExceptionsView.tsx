"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BugIcon,
  CheckIcon,
  CircleCheckIcon,
  FileJsonIcon,
  LockIcon,
  RefreshCwIcon,
  RotateCcwIcon,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  deskErrorMessage,
  useAgentSession,
  useExceptions,
  useIntakeHealth,
  useReplayException,
  useResolveException,
} from "@/lib/agent-api/hooks";
import type { ExceptionDto } from "@/lib/agent-api/types";

type Scope = "unresolved" | "resolved" | "all";

const PAGE_SIZE = 25;

export function ExceptionsView() {
  const { hasRole } = useAgentSession();
  const isSupervisor = hasRole("supervisor");

  const [scope, setScope] = useState<Scope>("unresolved");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ExceptionDto | null>(null);

  const health = useIntakeHealth();
  const query = {
    resolved: scope === "all" ? undefined : scope === "resolved",
    limit: PAGE_SIZE,
    offset,
  };
  const { data, isLoading, isError, error, refetch, isFetching } = useExceptions(
    query,
    isSupervisor,
  );

  if (!isSupervisor) {
    return (
      <>
        <PageHeader title="Intake exceptions" />
        <EmptyState
          icon={LockIcon}
          title="Supervisor role required"
          description="The intake-exception routes are supervisor-gated by the API. Sign in with the supervisor role to review and replay failed submissions."
        />
      </>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Intake exceptions"
        description="Submissions the automation could not turn into a ticket."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCwIcon className={isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      {health.data && (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Total failures" value={health.data.totalFailures} />
          <SummaryTile
            label="Unresolved"
            value={health.data.unresolved}
            critical={health.data.unresolved > 0}
          />
          <SummaryTile
            label="Distinct reasons"
            value={Object.keys(health.data.byReason).length}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          value={scope}
          onValueChange={(value: string) => {
            if (!value) return;
            setScope(value as Scope);
            setOffset(0);
          }}
        >
          <ToggleGroupItem
            value="unresolved"
            className="data-[state=on]:bg-primary-muted data-[state=on]:text-primary"
          >
            Unresolved
          </ToggleGroupItem>
          <ToggleGroupItem
            value="resolved"
            className="data-[state=on]:bg-primary-muted data-[state=on]:text-primary"
          >
            Resolved
          </ToggleGroupItem>
          <ToggleGroupItem
            value="all"
            className="data-[state=on]:bg-primary-muted data-[state=on]:text-primary"
          >
            All
          </ToggleGroupItem>
        </ToggleGroup>

        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} {total === 1 ? "exception" : "exceptions"}
          </span>
        )}
      </div>

      {isError ? (
        <ErrorState
          title="Could not load exceptions"
          description={deskErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CircleCheckIcon}
          title={scope === "unresolved" ? "Nothing needs attention" : "No exceptions here"}
          description={
            scope === "unresolved"
              ? "Every submission the automation received has been logged successfully."
              : "Try a different scope."
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {items.map((exception) => (
              <ExceptionRow
                key={exception.id}
                exception={exception}
                onInspect={() => setSelected(exception)}
              />
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}–{offset + items.length} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PayloadDialog exception={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function SummaryTile({
  label,
  value,
  critical,
}: {
  label: string;
  value: number;
  critical?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          critical
            ? "text-2xl font-semibold text-destructive tabular-nums"
            : "text-2xl font-semibold tabular-nums"
        }
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ExceptionRow({
  exception,
  onInspect,
}: {
  exception: ExceptionDto;
  onInspect: () => void;
}) {
  const replay = useReplayException();
  const resolve = useResolveException();

  const busy = replay.isPending || resolve.isPending;
  const isDuplicate = exception.exceptionReason === "DuplicateTicket";

  return (
    <Card className="gap-3 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={exception.exceptionType === "System" ? "destructive" : "warning"}>
                <BugIcon className="size-3" />
                {exception.exceptionType}
              </Badge>
              <span className="text-sm font-medium">{exception.exceptionReason}</span>
              {exception.resolved && (
                <Badge variant="success">
                  <CheckIcon className="size-3" />
                  Resolved
                </Badge>
              )}
              {exception.retryCount > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {exception.retryCount} {exception.retryCount === 1 ? "retry" : "retries"}
                </Badge>
              )}
            </div>

            {exception.errorMessage && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {exception.errorMessage}
              </p>
            )}

            <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {exception.ticketId && (
                <Link
                  href={`/agent/tickets/${encodeURIComponent(exception.ticketId)}`}
                  className="font-mono text-primary underline-offset-4 hover:underline"
                >
                  {exception.ticketId}
                </Link>
              )}
              {exception.occurredAt && (
                <span>{new Date(exception.occurredAt).toLocaleString()}</span>
              )}
              {exception.sourceSystem && <span>{exception.sourceSystem}</span>}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onInspect}>
              <FileJsonIcon className="size-3.5" />
              Inspect
            </Button>

            {!exception.resolved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={busy || !exception.replayable}
                  title={
                    exception.replayable
                      ? "Re-queue this submission from its captured payload"
                      : isDuplicate
                        ? "A duplicate has nothing to replay — the ticket already exists"
                        : "The captured payload cannot be replayed"
                  }
                  onClick={() => replay.mutate(exception.id)}
                >
                  <RotateCcwIcon className="size-3.5" />
                  {replay.isPending ? "Replaying…" : "Replay"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={busy}
                  onClick={() => resolve.mutate({ id: exception.id })}
                >
                  <CheckIcon className="size-3.5" />
                  Resolve
                </Button>
              </>
            )}
          </div>
        </div>

        {!exception.replayable && !exception.resolved && (
          <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
            {isDuplicate
              ? "A ticket with this id already exists — verify it, then mark this resolved."
              : "No replayable payload was captured. The customer would need to resubmit."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PayloadDialog({
  exception,
  onClose,
}: {
  exception: ExceptionDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!exception} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{exception?.exceptionReason ?? "Exception"}</DialogTitle>
          <DialogDescription>
            {exception?.exceptionType} exception
            {exception?.occurredAt
              ? ` · ${new Date(exception.occurredAt).toLocaleString()}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {exception && (
          <div className="space-y-4">
            {exception.errorMessage && (
              <Section title="Error">
                <p className="text-sm">{exception.errorMessage}</p>
              </Section>
            )}

            <Section title="Captured payload">
              {exception.rawPayload ? (
                <ScrollArea className="h-64 rounded-md border bg-muted/40">
                  <pre className="p-3 font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(exception.rawPayload, null, 2)}
                  </pre>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {exception.rawPayloadText
                    ? "Captured, but not valid JSON — it cannot be replayed."
                    : "No payload was captured."}
                </p>
              )}
            </Section>

            {exception.stackTrace && (
              <Section title="Stack trace">
                <ScrollArea className="h-40 rounded-md border bg-muted/40">
                  <pre className="p-3 font-mono text-[11px] whitespace-pre-wrap">
                    {exception.stackTrace}
                  </pre>
                </ScrollArea>
              </Section>
            )}

            <Section title="Provenance">
              <dl className="grid grid-cols-[10rem_1fr] gap-1 text-xs">
                <dt className="text-muted-foreground">Exception id</dt>
                <dd className="font-mono break-all">{exception.id}</dd>
                <dt className="text-muted-foreground">Queue reference</dt>
                <dd className="font-mono break-all">
                  {exception.queueItemReference ?? "—"}
                </dd>
                <dt className="text-muted-foreground">Workflow instance</dt>
                <dd className="font-mono break-all">
                  {exception.workflowInstanceId ?? "—"}
                </dd>
              </dl>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium text-muted-foreground uppercase">{title}</h3>
      {children}
    </div>
  );
}
