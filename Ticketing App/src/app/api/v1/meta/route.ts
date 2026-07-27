import { ok, preflight } from "@/lib/server/http";
import { CATEGORIES } from "@/lib/mock-data/categories";
import { DEPARTMENTS } from "@/lib/mock-data/departments";
import { AGENTS } from "@/lib/mock-data/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export function GET() {
  return ok({
    categories: CATEGORIES,
    departments: DEPARTMENTS,
    agents: AGENTS,
    statuses: ["submitted", "assigned", "in_progress", "awaiting_customer", "resolved", "closed"],
    priorities: ["low", "medium", "high", "urgent"],
  });
}
