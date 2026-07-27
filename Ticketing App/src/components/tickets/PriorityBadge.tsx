import type { TicketPriority } from "@/lib/types";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: TicketPriority; className?: string }) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <Badge variant={config.badgeVariant} className={cn(className)}>
      <Icon />
      {config.label}
    </Badge>
  );
}
