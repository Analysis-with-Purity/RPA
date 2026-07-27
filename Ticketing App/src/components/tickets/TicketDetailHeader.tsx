import Link from "next/link";
import { ArrowLeftIcon, StarIcon } from "lucide-react";

import type { Ticket } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";
import { getCategoryById } from "@/lib/mock-data/categories";
import { getDepartmentById } from "@/lib/mock-data/departments";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { StartProcessButton } from "@/components/tickets/StartProcessButton";
import { Badge } from "@/components/ui/badge";

export function TicketDetailHeader({ ticket }: { ticket: Ticket }) {
  const category = getCategoryById(ticket.categoryId);
  const department = getDepartmentById(ticket.departmentId);

  return (
    <div className="space-y-4">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Back to tickets
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
            {ticket.slaBreached && <Badge variant="destructive">SLA breached</Badge>}
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            Opened {formatDate(ticket.createdAt)}
            {category && ` Â· ${category.name}`}
            {department && ` Â· ${department.name}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <StartProcessButton ticket={ticket} />
        </div>
      </div>

      {ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ticket.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {typeof ticket.satisfactionRating === "number" && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Customer rating:</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={cn(
                  "size-4",
                  i < (ticket.satisfactionRating ?? 0)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
