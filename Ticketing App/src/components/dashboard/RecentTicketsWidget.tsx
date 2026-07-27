import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import type { Ticket } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";

export function RecentTicketsWidget({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="divide-y">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="flex items-center gap-4 py-3 transition-colors hover:bg-accent/50 -mx-2 px-2 rounded-md"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground">
              {ticket.id} &middot; {formatRelativeTime(ticket.createdAt)}
            </p>
          </div>
          <PriorityBadge priority={ticket.priority} className="hidden sm:inline-flex" />
          <StatusBadge status={ticket.status} />
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
