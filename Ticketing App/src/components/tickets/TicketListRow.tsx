import Link from "next/link";
import { ChevronRightIcon, PaperclipIcon } from "lucide-react";

import type { Ticket } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { getCategoryById } from "@/lib/mock-data/categories";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { TicketStepper } from "@/components/tickets/TicketStepper";
import { Badge } from "@/components/ui/badge";

export function TicketListRow({ ticket }: { ticket: Ticket }) {
  const category = getCategoryById(ticket.categoryId);

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
          {ticket.slaBreached && (
            <Badge variant="destructive" className="text-[10px]">
              SLA breached
            </Badge>
          )}
        </div>
        <p className="truncate font-medium">{ticket.subject}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {category && <span>{category.name}</span>}
          {ticket.tags.length > 0 && <span aria-hidden>&middot;</span>}
          {ticket.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] font-normal">
              {tag}
            </Badge>
          ))}
          {ticket.attachmentIds.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <PaperclipIcon className="size-3" />
              {ticket.attachmentIds.length}
            </span>
          )}
        </div>
      </div>

      <TicketStepper status={ticket.status} variant="compact" className="hidden md:flex" />

      <div className="flex items-center gap-2">
        <PriorityBadge priority={ticket.priority} className="hidden sm:inline-flex" />
        <StatusBadge status={ticket.status} />
      </div>

      <div className="flex items-center justify-between gap-3 sm:w-32 sm:flex-col sm:items-end">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(ticket.updatedAt)}
        </span>
        <ChevronRightIcon className="size-4 text-muted-foreground sm:hidden" />
      </div>
    </Link>
  );
}
