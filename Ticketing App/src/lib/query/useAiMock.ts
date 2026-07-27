import { useQuery } from "@tanstack/react-query";
import { suggestCategory, findDuplicates, getSuggestedSolution } from "@/lib/api/ai-mock";
import { queryKeys } from "./keys";

export function useCategorySuggestion(text: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.ai.category(text),
    queryFn: () => suggestCategory(text),
    enabled: enabled && text.trim().length >= 12,
    staleTime: Infinity,
  });
}

export function useDuplicateDetection(subject: string, description: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.ai.duplicates(subject, description),
    queryFn: () => findDuplicates(subject, description),
    enabled: enabled && subject.trim().length >= 8,
    staleTime: Infinity,
  });
}

export function useSuggestedSolution(categoryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ai.solution(categoryId ?? ""),
    queryFn: () => getSuggestedSolution(categoryId as string),
    enabled: !!categoryId,
    staleTime: Infinity,
  });
}
