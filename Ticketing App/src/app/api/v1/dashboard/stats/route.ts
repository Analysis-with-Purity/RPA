import { ok, error, preflight } from "@/lib/server/http";
import { getDashboardStats } from "@/lib/server/ticket-repository";
import { DataFabricError } from "@/lib/server/data-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  try {
    return ok(await getDashboardStats());
  } catch (err) {
    if (err instanceof DataFabricError) return error(err.message, 502);
    return error(err instanceof Error ? err.message : "Unexpected error.", 500);
  }
}
