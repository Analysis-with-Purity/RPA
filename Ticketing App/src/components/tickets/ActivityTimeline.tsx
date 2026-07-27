import {
  PlusCircleIcon,
  RefreshCwIcon,
  UserCheckIcon,
  ArrowUpDownIcon,
  RotateCcwIcon,
  type LucideIcon,
} from "lucide-react";

import type { ActivityEvent, ActivityEventType, TicketStatus, TicketPriority } from "@/lib/types";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";

const ACTIVITY_CONFIG: Record<ActivityEventType, { label: string; icon: LucideIcon }> = {
  created: { label: "created this ticket", icon: PlusCircleIcon },
  status_changed: { label: "changed status", icon: RefreshCwIcon },
  assigned: { label: "assigned this ticket", icon: UserCheckIcon },
  priority_changed: { label: "changed priority", icon: ArrowUpDownIcon },
  reopened: { label: "reopened this ticket", icon: RotateCcwIcon },
};

function statusLabel(value: string) {
  return STATUS_CONFIG[value as TicketStatus]?.label ?? value;
}

function priorityLabel(value: string) {
  return PRIORITY_CONFIG[value as TicketPriority]?.label ?? value;
}

function eventDescription(event: ActivityEvent) {
  const config = ACTIVITY_CONFIG[event.type];
  if (event.type === "assigned" && event.toValue) {
    return `assigned this ticket to ${event.toValue}`;
  }
  if (event.type === "status_changed" && event.fromValue && event.toValue) {
    return `${config.label} from "${statusLabel(event.fromValue)}" to "${statusLabel(event.toValue)}"`;
  }
  if (event.type === "priority_changed" && event.fromValue && event.toValue) {
    return `${config.label} from "${priorityLabel(event.fromValue)}" to "${priorityLabel(event.toValue)}"`;
  }
  return config.label;
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  return (
    <ol className="space-y-5">
      {events.map((event, index) => {
        const config = ACTIVITY_CONFIG[event.type];
        const Icon = config.icon;
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="relative flex gap-3 pb-1">
            {!isLast && (
              <span className="absolute top-7 left-3.5 h-[calc(100%-0.25rem)] w-px bg-border" />
            )}
            <div className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 pt-0.5 text-sm">
              <p>
                <span className="font-medium">{event.actor.name}</span>{" "}
                <span className="text-muted-foreground">{eventDescription(event)}</span>
              </p>
              <p
                className="text-xs text-muted-foreground"
                title={formatDateTime(event.createdAt)}
              >
                {formatRelativeTime(event.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
