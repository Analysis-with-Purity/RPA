import { json, preflight } from "@/lib/server/http";
import { isUiPathConfigured } from "@/lib/server/uipath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export function GET() {
  return json({
    status: "ok",
    service: "purity-support-api",
    version: "v1",
    uipathConfigured: isUiPathConfigured(),
  });
}
