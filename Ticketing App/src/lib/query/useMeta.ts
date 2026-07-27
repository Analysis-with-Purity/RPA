import { useQuery } from "@tanstack/react-query";
import { getCategories, getDepartments, getAgents } from "@/lib/api/meta";
import { queryKeys } from "./keys";

const STATIC_STALE_TIME = 5 * 60 * 1000;

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.meta.categories,
    queryFn: getCategories,
    staleTime: STATIC_STALE_TIME,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.meta.departments,
    queryFn: getDepartments,
    staleTime: STATIC_STALE_TIME,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.meta.agents,
    queryFn: getAgents,
    staleTime: STATIC_STALE_TIME,
  });
}
