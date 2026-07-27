import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { CATEGORIES } from "@/lib/mock-data/categories";
import { DEPARTMENTS } from "@/lib/mock-data/departments";
import type { DfRecord } from "@/lib/server/data-fabric";

/**
 * Translation between the `SupportTicket` Data Fabric entity and the app's `Ticket` type.
 *
 * The entity stores category and department as display *names* — that is what the robot
 * writes from the queue item — while the UI works in ids. Status vocabulary differs too:
 * the automation writes "Not Assigned", the UI models a six-state lifecycle. Both mappings
 * are lossy in one direction, so each is explicit and each falls back rather than throwing:
 * a ticket with an unrecognised category should still be readable.
 */

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function optionalStr(v: unknown): string | undefined {
  const s = str(v);
  return s === "" ? undefined : s;
}

// --------------------------------------------------------------------------- status

/**
 * Entity → UI. The automation's vocabulary is narrower than the UI's, so several entity
 * values collapse onto one UI state. Anything unrecognised reads as "submitted", the safest
 * default: it shows as open work rather than silently looking finished.
 */
const STATUS_FROM_ENTITY: Record<string, TicketStatus> = {
  "not assigned": "submitted",
  unassigned: "submitted",
  submitted: "submitted",
  new: "submitted",
  assigned: "assigned",
  "in progress": "in_progress",
  in_progress: "in_progress",
  inprogress: "in_progress",
  "waiting on customer": "awaiting_customer",
  awaiting_customer: "awaiting_customer",
  pending: "awaiting_customer",
  resolved: "resolved",
  closed: "closed",
  cancelled: "closed",
};

/** UI → entity. Writes the vocabulary the automation and the rest of the tenant expect. */
const STATUS_TO_ENTITY: Record<TicketStatus, string> = {
  submitted: "Not Assigned",
  assigned: "Assigned",
  in_progress: "In Progress",
  awaiting_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

export function statusFromEntity(value: unknown): TicketStatus {
  return STATUS_FROM_ENTITY[str(value).trim().toLowerCase()] ?? "submitted";
}

export function statusToEntity(status: TicketStatus): string {
  return STATUS_TO_ENTITY[status] ?? "Not Assigned";
}

// ------------------------------------------------------------------------- priority

const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

/** Records exist with both "High" and "high" depending on which client wrote them. */
export function priorityFromEntity(value: unknown): TicketPriority {
  const v = str(value).trim().toLowerCase();
  return (PRIORITIES as string[]).includes(v) ? (v as TicketPriority) : "medium";
}

// -------------------------------------------------------- category / department ids

function idFromName(
  table: ReadonlyArray<{ id: string; name: string }>,
  value: unknown,
  fallbackId: string,
): string {
  const v = str(value).trim().toLowerCase();
  if (!v) return fallbackId;
  // The column may hold a display name or an id depending on the writer — accept both
  // rather than losing the value.
  const hit =
    table.find((row) => row.name.toLowerCase() === v) ??
    table.find((row) => row.id.toLowerCase() === v);
  return hit?.id ?? fallbackId;
}

export function categoryIdFromEntity(value: unknown): string {
  return idFromName(CATEGORIES, value, "cat-general");
}

export function departmentIdFromEntity(value: unknown): string {
  return idFromName(DEPARTMENTS, value, "dept-support");
}

export function categoryNameFromId(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function departmentNameFromId(id: string): string {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

// ------------------------------------------------------------------------ record ↔ dto

/** Data Fabric's row GUID. Kept out of the UI type, but required to update the row. */
export function recordIdOf(record: DfRecord): string {
  return str(record.Id);
}

function csatOf(value: unknown): Ticket["satisfactionRating"] {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? (n as 1 | 2 | 3 | 4 | 5) : undefined;
}

export function toTicket(record: DfRecord): Ticket {
  const createdAt =
    optionalStr(record.CreatedDate) ??
    optionalStr(record.IngestedAt) ??
    optionalStr(record.CreateTime) ??
    new Date(0).toISOString();

  const updatedAt = optionalStr(record.UpdateTime) ?? createdAt;

  return {
    id: str(record.TicketId) || str(record.Id),
    subject: str(record.Subject),
    description: str(record.Description),
    status: statusFromEntity(record.Status),
    priority: priorityFromEntity(record.Priority),
    categoryId: categoryIdFromEntity(record.Category),
    departmentId: departmentIdFromEntity(record.Department),
    // SupportTicket has no tags column — the concept lives only in the UI.
    tags: [],
    requester: {
      // No requester id on the entity; derive a stable one from the email so the UI can key
      // on it without inventing a fresh identity each render.
      id: optionalStr(record.CustomerEmail)
        ? `req-${str(record.CustomerEmail).toLowerCase()}`
        : "req-unknown",
      name:
        optionalStr(record.CustomerName) ??
        optionalStr(record.CustomerEmail) ??
        "Unknown requester",
      email: optionalStr(record.CustomerEmail) ?? "unknown@example.com",
    },
    // The entity records the agent by name and email, not by the UI's mock agent id, so
    // there is nothing safe to map onto assignedAgentId.
    assignedAgentId: undefined,
    attachmentIds: [],
    // No message table backs this entity set, so a thread count cannot be derived.
    messageCount: 0,
    createdAt,
    updatedAt,
    resolvedAt: optionalStr(record.ResolutionDate) ?? optionalStr(record.ClosedDate),
    firstResponseAt: optionalStr(record.FirstResponseDate),
    satisfactionRating: csatOf(record.CsatScore),
    slaBreached: record.SlaBreached === true || record.SlaBreached === "true",
  };
}

/** The agent's display name, which the UI type has no field for. */
export function assignedAgentNameOf(record: DfRecord): string | undefined {
  return optionalStr(record.AssignedAgent);
}
