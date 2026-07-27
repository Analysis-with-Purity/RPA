import type { TicketStatus } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.badgeVariant} className={cn(className)}>
      <Icon className={cn(status === "in_progress" && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
