import { ok, error, preflight, readJson } from "@/lib/server/http";
import type { CreateTicketBody, TicketQuery } from "@/lib/server/ticket-store";
import { draftTicket, listTickets } from "@/lib/server/ticket-repository";
import { DataFabricError, isDataFabricConfigured } from "@/lib/server/data-fabric";
import { getCategoryById } from "@/lib/mock-data/categories";
import { getDepartmentById } from "@/lib/mock-data/departments";
import { queueTicketIntake } from "@/lib/server/orchestration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(request: Request) {
  if (!isDataFabricConfigured()) {
    return error(
      "UiPath is not configured. Set UIPATH_ORG, UIPATH_TENANT and UIPATH_SECRET in .env.local.",
      503,
    );
  }

  const params = new URL(request.url).searchParams;
  const query: TicketQuery = {
    search: params.get("search") ?? undefined,
    status: (params.get("status") as TicketQuery["status"]) ?? undefined,
    priority: (params.get("priority") as TicketQuery["priority"]) ?? undefined,
    departmentId: params.get("departmentId") ?? undefined,
    sort: (params.get("sort") as TicketQuery["sort"]) ?? undefined,
  };

  try {
    const { tickets, total, truncated } = await listTickets(query);
    return ok({ tickets, total, truncated });
  } catch (err) {
    if (err instanceof DataFabricError) return error(err.message, 502);
    return error(err instanceof Error ? err.message : "Unexpected error.", 500);
  }
}

export async function POST(request: Request) {
  const body = await readJson<CreateTicketBody>(request);
  if (!body) return error("Request body must be valid JSON.");

  const missing = ["subject", "description", "categoryId", "departmentId"].filter(
    (field) => !body[field as keyof CreateTicketBody],
  );
  if (missing.length > 0) {
    return error(`Missing required field(s): ${missing.join(", ")}.`, 422);
  }
  if (!getCategoryById(body.categoryId)) {
    return error(`Unknown categoryId "${body.categoryId}". See GET /api/v1/meta.`, 422);
  }
  if (!getDepartmentById(body.departmentId)) {
    return error(`Unknown departmentId "${body.departmentId}". See GET /api/v1/meta.`, 422);
  }
  if (body.priority && !["low", "medium", "high", "urgent"].includes(body.priority)) {
    return error(`Invalid priority "${body.priority}".`, 422);
  }

  const ticket = draftTicket(body);

  // Q_TicketIntake is the only creation path: the intake workflow reads the item and writes
  // the Data Fabric record with Status = "Not Assigned". The API never inserts the ticket
  // itself, so there is exactly one writer for new tickets.
  const queued = await queueTicketIntake(ticket);

  if (!queued.queued) {
    // Without the queue item nothing will ever create this ticket. Reporting 201 here would
    // tell the customer their request was logged when it was dropped.
    return error(`Could not queue the ticket for processing: ${queued.error ?? "unknown error"}`, 502);
  }

  // 202, not 201: the record does not exist yet. The workflow creates it moments later, and
  // GET /api/v1/tickets/{id} returns 404 until it does.
  return ok({ ...ticket, status: "submitted", queued, persisted: false }, 202);
}
