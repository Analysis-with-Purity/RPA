"use client";

import type { TicketPriority } from "@/lib/types";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export function PrioritySelector({
  value,
  onChange,
}: {
  value: TicketPriority;
  onChange: (priority: TicketPriority) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => v && onChange(v as TicketPriority)}
      className="w-full"
    >
      {PRIORITIES.map((priority) => {
        const config = PRIORITY_CONFIG[priority];
        const Icon = config.icon;
        return (
          <ToggleGroupItem key={priority} value={priority} className="gap-1.5">
            <Icon className="size-3.5" />
            {config.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
