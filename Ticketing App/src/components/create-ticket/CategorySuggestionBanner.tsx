"use client";

import { SparklesIcon } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCategorySuggestion } from "@/lib/query/useAiMock";
import { getCategoryById } from "@/lib/mock-data/categories";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CategorySuggestionBannerProps {
  description: string;
  currentCategoryId: string;
  onApply: (categoryId: string) => void;
}

export function CategorySuggestionBanner({
  description,
  currentCategoryId,
  onApply,
}: CategorySuggestionBannerProps) {
  const debouncedDescription = useDebouncedValue(description, 500);
  const suggestionQuery = useCategorySuggestion(debouncedDescription, true);

  const suggestion = suggestionQuery.data;
  if (suggestionQuery.isFetching || !suggestion || suggestion.categoryId === currentCategoryId) {
    return null;
  }

  const category = getCategoryById(suggestion.categoryId);
  if (!category) return null;

  return (
    <Alert variant="info">
      <SparklesIcon />
      <AlertTitle>AI suggestion</AlertTitle>
      <AlertDescription>
        <p>
          This sounds like a <strong>{category.name}</strong> issue (
          {Math.round(suggestion.confidence * 100)}% match).
        </p>
        <Button size="sm" variant="default" className="mt-1" onClick={() => onApply(category.id)}>
          Apply category
        </Button>
      </AlertDescription>
    </Alert>
  );
}
