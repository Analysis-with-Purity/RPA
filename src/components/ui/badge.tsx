import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border border-line bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/70",
        className
      )}
      {...props}
    />
  );
}

export function GoldBadge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-ink px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-gold",
        className
      )}
      {...props}
    />
  );
}
