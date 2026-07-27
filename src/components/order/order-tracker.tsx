import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

const LABELS: Record<(typeof STEPS)[number], string> = {
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export function OrderTracker({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="border border-red-200 bg-red-50 text-red-700 text-sm px-5 py-4">
        This order has been cancelled.
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} className="flex-1 flex items-center last:flex-none">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0",
                  done ? "bg-royal border-royal text-white" : "border-line text-ink/30"
                )}
              >
                {done ? <Check size={14} /> : <span className="text-xs">{i + 1}</span>}
              </div>
              <span className={cn("text-[10px] uppercase tracking-wide text-center", done ? "text-ink" : "text-ink/30")}>
                {LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 -mt-5", i < currentIndex ? "bg-royal" : "bg-line")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
