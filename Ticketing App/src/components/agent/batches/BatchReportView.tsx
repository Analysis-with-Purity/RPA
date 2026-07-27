"use client";

import Link from "next/link";
import { useState } from "react";
import { BoxesIcon, RefreshCwIcon, ShieldAlertIcon, TriangleAlertIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { deskErrorMessage, useBatchReport } from "@/lib/agent-api/hooks";

/**
 * Batch-code rollup — the first screen of a counterfeit or adverse-event investigation.
 *
 * The API sorts safety reports first, then volume, and that order is preserved here: during
 * an incident the top of this table is the thing you act on.
 */
export function BatchReportView() {
  const { data, isLoading, isError, error, refetch, isFetching } = useBatchReport();
  const [filter, setFilter] = useState("");

  const batches = (data?.batches ?? []).filter((b) => {
    if (!filter.trim()) return true;
    const needle = filter.trim().toLowerCase();
    return (
      b.batchCode.toLowerCase().includes(needle) ||
      b.productNames.some((p) => p.toLowerCase().includes(needle))
    );
  });

  const flagged = (data?.batches ?? []).filter(
    (b) => b.safetyReports > 0 || b.authenticityReports > 0,
  );

  return (
    <>
      <PageHeader
        title="Batch report"
        description="Tickets grouped by batch code, safety reports first."
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

      {isError ? (
        <ErrorState
          title="Could not load the batch report"
          description={deskErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !data || data.batches.length === 0 ? (
        <EmptyState
          icon={BoxesIcon}
          title="No batch codes recorded"
          description="Batch codes are captured on Product Quality, Authenticity and Health & Safety tickets. None have come through yet."
        />
      ) : (
        <>
          {flagged.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <ShieldAlertIcon className="size-4" />
                  {flagged.length} {flagged.length === 1 ? "batch needs" : "batches need"} review
                </CardTitle>
                <CardDescription>
                  Batches carrying a safety or authenticity report.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {flagged.map((b) => (
                  <Link
                    key={b.batchCode}
                    href={`/agent/queue?preset=all&batchCode=${encodeURIComponent(b.batchCode)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive-muted px-3 py-1 text-xs transition-colors hover:border-destructive"
                  >
                    <span className="font-mono font-medium">{b.batchCode}</span>
                    {b.safetyReports > 0 && (
                      <span className="text-destructive">{b.safetyReports} safety</span>
                    )}
                    {b.authenticityReports > 0 && (
                      <span className="text-warning">{b.authenticityReports} authenticity</span>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between gap-4">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by batch code or product…"
              className="max-w-xs"
            />
            <span className="text-sm text-muted-foreground">
              {batches.length} of {data.batches.length}{" "}
              {data.batches.length === 1 ? "batch" : "batches"}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Batch</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Products</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Categories</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Safety</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Authenticity</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Open</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.map((batch) => (
                  <tr key={batch.batchCode} className="hover:bg-muted/40">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/agent/queue?preset=all&batchCode=${encodeURIComponent(batch.batchCode)}`}
                        className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                      >
                        {batch.batchCode}
                      </Link>
                    </td>
                    <td className="max-w-[16rem] px-3 py-2.5">
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {batch.productNames.join(", ") || "—"}
                      </span>
                    </td>
                    <td className="max-w-[14rem] px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {batch.categories.map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {batch.safetyReports > 0 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-destructive">
                          <TriangleAlertIcon className="size-3.5" />
                          {batch.safetyReports}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {batch.authenticityReports > 0 ? (
                        <span className="font-medium text-warning">
                          {batch.authenticityReports}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{batch.openTickets}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                      {batch.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Derived from the most recent {data.sampled.toLocaleString()} tickets carrying a
            batch code.
          </p>
        </>
      )}
    </>
  );
}
