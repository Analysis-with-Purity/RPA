import {
  BanknoteIcon,
  CircleCheckIcon,
  CircleDotIcon,
  ClockIcon,
  LoaderIcon,
  MinusIcon,
  TriangleAlertIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Priority, RefundStatus, TicketStatus } from "@/lib/agent-api/catalog";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

/**
 * Status colouring. Blue is the only brand hue, so lifecycle progress is carried by tone
 * (outline → tint → solid) and the semantic colours are kept for outcomes: amber means the
 * clock is on the customer, green means done, grey means over.
 */
const STATUS_STYLE: Record<
  TicketStatus,
  { variant: BadgeVariant; icon: typeof CircleDotIcon; spin?: boolean }
> = {
  "Not Assigned": { variant: "outline", icon: CircleDotIcon },
  Assigned: { variant: "info", icon: UserIcon },
  "In Progress": { variant: "default", icon: LoaderIcon, spin: true },
  "Waiting on Customer": { variant: "warning", icon: ClockIcon },
  Resolved: { variant: "success", icon: CircleCheckIcon },
  Closed: { variant: "secondary", icon: XCircleIcon },
  Cancelled: { variant: "secondary", icon: MinusIcon },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE["Not Assigned"];
  const Icon = style.icon;

  return (
    <Badge
      variant={style.variant}
      className={cn(
        // Unassigned is the one status that is nobody's yet — dashed says "needs picking up"
        // without spending a semantic colour on it.
        status === "Not Assigned" && "border-dashed",
        status === "Cancelled" && "text-muted-foreground line-through",
        className,
      )}
    >
      <Icon className={cn(style.spin && "animate-spin")} />
      {status}
    </Badge>
  );
}

const PRIORITY_STYLE: Record<Priority, BadgeVariant> = {
  Low: "outline",
  Medium: "secondary",
  High: "warning",
  Urgent: "destructive",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority | null;
  className?: string;
}) {
  if (!priority) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        —
      </Badge>
    );
  }

  return (
    <Badge variant={PRIORITY_STYLE[priority] ?? "secondary"} className={className}>
      {priority === "Urgent" && <TriangleAlertIcon />}
      {priority}
    </Badge>
  );
}

const REFUND_STYLE: Record<RefundStatus, BadgeVariant> = {
  None: "outline",
  Requested: "warning",
  Approved: "info",
  Processed: "success",
  Rejected: "destructive",
};

export function RefundBadge({
  status,
  amount,
  className,
}: {
  status: RefundStatus | null;
  amount?: number | null;
  className?: string;
}) {
  if (!status || status === "None") return null;

  return (
    <Badge variant={REFUND_STYLE[status] ?? "secondary"} className={className}>
      <BanknoteIcon />
      {status}
      {typeof amount === "number" && amount > 0 && ` · ${amount.toFixed(2)}`}
    </Badge>
  );
}

// ------------------------------------------------------------------------- SLA

/** Turns a signed minute count into something an agent can read at a glance. */
export function formatMinutes(minutes: number): string {
  const abs = Math.abs(minutes);
  if (abs < 60) return `${abs}m`;
  if (abs < 60 * 24) {
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(abs / (60 * 24));
  const h = Math.floor((abs % (60 * 24)) / 60);
  return h ? `${d}d ${h}h` : `${d}d`;
}

/**
 * Resolution-clock indicator.
 *
 * `breached` comes from the server, which computes it on read rather than trusting the
 * stored flag — so a ticket that went overdue overnight still reports correctly here.
 */
export function SlaBadge({
  minutesToDue,
  breached,
  terminal,
  className,
}: {
  minutesToDue: number | null;
  breached: boolean;
  /** Resolved/Closed/Cancelled — the clock has stopped, so don't imply it is still running. */
  terminal?: boolean;
  className?: string;
}) {
  if (minutesToDue === null) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>No SLA</span>
    );
  }

  if (breached) {
    return (
      <Badge variant="destructive" className={className}>
        <TriangleAlertIcon />
        {formatMinutes(minutesToDue)} over
      </Badge>
    );
  }

  if (terminal) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>Met</span>
    );
  }

  // Two hours is the same threshold the API's SLA report uses for "due soon".
  const dueSoon = minutesToDue <= 120;

  return (
    <Badge variant={dueSoon ? "warning" : "outline"} className={className}>
      <ClockIcon />
      {formatMinutes(minutesToDue)} left
    </Badge>
  );
}
