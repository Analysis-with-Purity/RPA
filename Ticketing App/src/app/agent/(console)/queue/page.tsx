import { Suspense } from "react";

import { QueueView } from "@/components/agent/queue/QueueView";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * `QueueView` reads the filter state from `useSearchParams()`, which Next requires to sit
 * under a Suspense boundary so the rest of the shell can prerender.
 */
export default function QueuePage() {
  return (
    <Suspense fallback={<QueueFallback />}>
      <QueueView />
    </Suspense>
  );
}

function QueueFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-full max-w-md" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
