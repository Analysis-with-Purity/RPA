import type { DashboardStats } from "@/lib/types";
import { apiFetch } from "./client";

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/v1/dashboard/stats");
}
