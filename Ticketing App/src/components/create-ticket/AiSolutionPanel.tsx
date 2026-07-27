"use client";

import { LightbulbIcon } from "lucide-react";

import { useSuggestedSolution } from "@/lib/query/useAiMock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AiSolutionPanel({ categoryId }: { categoryId?: string }) {
  const solutionQuery = useSuggestedSolution(categoryId);

  if (!categoryId) return null;

  return (
    <Card className="border-primary/30 bg-primary-muted/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-primary">
          <LightbulbIcon className="size-4" /> While you wait, this might help
        </CardTitle>
      </CardHeader>
      <CardContent>
        {solutionQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : solutionQuery.data ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">{solutionQuery.data.title}</p>
            <p className="text-sm text-muted-foreground">{solutionQuery.data.body}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
