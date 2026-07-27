import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MessageThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[false, true, false].map((isCustomer, i) => (
        <div key={i} className={cn("flex gap-3", isCustomer ? "flex-row-reverse" : "flex-row")}>
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className={cn("flex max-w-[70%] flex-col gap-1.5", isCustomer && "items-end")}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-14 w-64 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
