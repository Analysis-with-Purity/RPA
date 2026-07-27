"use client";

import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, PaperclipIcon, UserIcon } from "lucide-react";

import { PriorityBadge, RefundBadge, SlaBadge, StatusBadge } from "@/components/agent/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TicketDto } from "@/lib/agent-api/types";
import type { QueueState } from "./filters";

const TERMINAL_STATUSES = new Set(["Resolved", "Closed", "Cancelled"]);

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const diffMinutes = Math.round((Date.now() - then) / 60_000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)}h ago`;
  const days = Math.floor(diffMinutes / (60 * 24));
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

interface SortableHeaderProps {
  label: string;
  field: QueueState["sortBy"];
  state: QueueState;
  onSort: (field: QueueState["sortBy"]) => void;
  className?: string;
}

function SortableHeader({ label, field, state, onSort, className }: SortableHeaderProps) {
  const active = state.sortBy === field;
  return (
    <th
      scope="col"
      className={cn("px-3 py-2 text-left font-medium", className)}
      // aria-sort belongs on the header cell, not on the button inside it.
      aria-sort={active ? (state.sortDesc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {active &&
          (state.sortDesc ? (
            <ArrowDownIcon className="size-3.5" />
          ) : (
            <ArrowUpIcon className="size-3.5" />
          ))}
      </button>
    </th>
  );
}

interface QueueTableProps {
  tickets: TicketDto[];
  state: QueueState;
  onSort: (field: QueueState["sortBy"]) => void;
  isLoading: boolean;
  /** Dims the table while a filter change is in flight but the old rows are still shown. */
  isFetching: boolean;
}

export function QueueTable({
  tickets,
  state,
  onSort,
  isLoading,
  isFetching,
}: QueueTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border bg-card transition-opacity",
        isFetching && !isLoading && "opacity-60",
      )}
    >
      <table className="w-full min-w-[60rem] border-collapse text-sm">
        <thead className="border-b bg-muted/40 text-xs">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium text-muted-foreground">
              Ticket
            </th>
            <SortableHeader label="Status" field="Status" state={state} onSort={onSort} />
            <SortableHeader label="Priority" field="Priority" state={state} onSort={onSort} />
            <th scope="col" className="px-3 py-2 text-left font-medium text-muted-foreground">
              Assignee
            </th>
            <SortableHeader
              label="Resolution SLA"
              field="ResolutionDueDate"
              state={state}
              onSort={onSort}
            />
            <SortableHeader label="Created" field="CreatedDate" state={state} onSort={onSort} />
          </tr>
        </thead>

        <tbody className="divide-y">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            : tickets.map((ticket) => (
                <TicketRow key={ticket.ticketId} ticket={ticket} />
              ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: TicketDto }) {
  const href = `/agent/tickets/${encodeURIComponent(ticket.ticketId)}`;
  const terminal = TERMINAL_STATUSES.has(ticket.status);

  return (
    <tr className="group transition-colors hover:bg-muted/40">
      <td className="max-w-[28rem] px-3 py-2.5">
        <Link href={href} className="block space-y-0.5 outline-none">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {ticket.ticketNumber ?? ticket.ticketId}
            </span>
            {ticket.attachmentReferences.length > 0 && (
              <PaperclipIcon className="size-3 text-muted-foreground" />
            )}
            {ticket.sla.escalationLevel > 0 && (
              <span className="rounded bg-destructive-muted px-1 text-[10px] font-medium text-destructive">
                ESC {ticket.sla.escalationLevel}
              </span>
            )}
            <RefundBadge
              status={ticket.refund.status}
              amount={ticket.refund.amount}
              className="text-[10px]"
            />
          </div>
          <p className="truncate font-medium group-hover:text-primary">{ticket.subject}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[ticket.category, ticket.subcategory].filter(Boolean).join(" · ") ||
              "Uncategorised"}
            {ticket.customer.name ? ` — ${ticket.customer.name}` : ""}
          </p>
        </Link>
      </td>

      <td className="px-3 py-2.5">
        <StatusBadge status={ticket.status} />
      </td>

      <td className="px-3 py-2.5">
        <PriorityBadge priority={ticket.priority} />
      </td>

      <td className="px-3 py-2.5">
        {ticket.assignment.agent ? (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <UserIcon className="size-3.5 text-muted-foreground" />
            <span className="truncate">{ticket.assignment.agent}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {ticket.assignment.group ?? "Unassigned"}
          </span>
        )}
      </td>

      <td className="px-3 py-2.5">
        <SlaBadge
          minutesToDue={ticket.sla.minutesToResolutionDue}
          breached={ticket.sla.resolutionBreached}
          terminal={terminal}
        />
      </td>

      <td className="px-3 py-2.5 text-xs whitespace-nowrap text-muted-foreground">
        {relativeDate(ticket.createdDate)}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-3 py-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-4 w-64" />
        <Skeleton className="mt-2 h-3 w-40" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-5 w-24 rounded-full" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-3 py-2.5">
        <Skeleton className="h-4 w-16" />
      </td>
    </tr>
  );
}
