"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon, RefreshCwIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { deskErrorMessage, useAgentSession, useTicketSearch } from "@/lib/agent-api/hooks";
import { QueueFilterBar } from "./QueueFilterBar";
import { QueueTable } from "./QueueTable";
import {
  PAGE_SIZE,
  parseQueueState,
  serializeQueueState,
  toSearchQuery,
  type QueueState,
} from "./filters";

export function QueueView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session } = useAgentSession();

  const state = useMemo(() => parseQueueState(searchParams), [searchParams]);

  const query = useMemo(
    () => toSearchQuery(state, session?.subject ?? ""),
    [state, session?.subject],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useTicketSearch(query);

  const setState = useCallback(
    (next: QueueState) => {
      // replace, not push — filter tweaks should not fill the back button with dead ends.
      router.replace(`${pathname}${serializeQueueState(next)}`, { scroll: false });
    },
    [pathname, router],
  );

  const onSort = useCallback(
    (field: QueueState["sortBy"]) =>
      setState({
        ...state,
        sortBy: field,
        // Re-clicking the active column flips direction; a new column starts descending.
        sortDesc: state.sortBy === field ? !state.sortDesc : true,
        offset: 0,
      }),
    [state, setState],
  );

  const tickets = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageStart = state.offset + 1;
  const pageEnd = state.offset + tickets.length;
  const hasPrev = state.offset > 0;
  const hasNext = state.offset + PAGE_SIZE < total;

  return (
    <>
      <PageHeader
        title="Queue"
        description="Every ticket in Data Fabric, filtered the way the API can actually query it."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCwIcon className={isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
        }
      />

      <QueueFilterBar
        state={state}
        onChange={setState}
        total={isLoading ? undefined : total}
      />

      {isError ? (
        <ErrorState
          title="Could not load the queue"
          description={deskErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : !isLoading && tickets.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No tickets match these filters"
          description={
            state.preset === "breached"
              ? "Nothing is past its resolution deadline right now."
              : "Every filter on this API is an exact match — a partial order number or email will return nothing."
          }
          action={
            <Button variant="outline" size="sm" onClick={() => setState({ ...state, offset: 0, status: [] })}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <QueueTable
            tickets={tickets}
            state={state}
            onSort={onSort}
            isLoading={isLoading}
            isFetching={isFetching}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading…"
                : `Showing ${pageStart.toLocaleString()}–${pageEnd.toLocaleString()} of ${total.toLocaleString()}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrev || isFetching}
                onClick={() =>
                  setState({ ...state, offset: Math.max(0, state.offset - PAGE_SIZE) })
                }
              >
                <ChevronLeftIcon /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext || isFetching}
                onClick={() => setState({ ...state, offset: state.offset + PAGE_SIZE })}
              >
                Next <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
