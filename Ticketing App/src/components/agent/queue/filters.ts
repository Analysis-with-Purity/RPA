import type { ReadonlyURLSearchParams } from "next/navigation";

import { OPEN_STATUSES, type Priority, type RefundStatus, type TicketStatus } from "@/lib/agent-api/catalog";
import type { TicketSearchQuery } from "@/lib/agent-api/types";

/**
 * Queue state lives in the URL, not component state.
 *
 * That makes every view shareable — a supervisor can paste "unassigned Urgent in Logistics"
 * into chat — and lets the jump bar link straight to a filtered queue.
 */

export const PRESETS = ["open", "unassigned", "mine", "breached", "all"] as const;
export type Preset = (typeof PRESETS)[number];

export const PRESET_LABELS: Record<Preset, string> = {
  open: "Open",
  unassigned: "Unassigned",
  mine: "Mine",
  breached: "Breached",
  all: "All",
};

export const DEFAULT_PRESET: Preset = "open";
export const PAGE_SIZE = 25;

export interface QueueState {
  preset: Preset;
  status: TicketStatus[];
  priority?: Priority;
  category?: string;
  assignmentGroup?: string;
  assignedAgentEmail?: string;
  customerEmail?: string;
  organization?: string;
  orderNumber?: string;
  batchCode?: string;
  productSku?: string;
  refundStatus?: RefundStatus;
  createdFrom?: string;
  createdTo?: string;
  sortBy: NonNullable<TicketSearchQuery["sortBy"]>;
  sortDesc: boolean;
  offset: number;
}

function one(params: ReadonlyURLSearchParams, key: string): string | undefined {
  const v = params.get(key);
  return v && v.trim() !== "" ? v : undefined;
}

export function parseQueueState(params: ReadonlyURLSearchParams): QueueState {
  const rawPreset = one(params, "preset");
  const preset = (PRESETS as readonly string[]).includes(rawPreset ?? "")
    ? (rawPreset as Preset)
    : DEFAULT_PRESET;

  const sortByRaw = one(params, "sortBy");
  const sortBy = (
    ["CreatedDate", "IngestedAt", "Priority", "Status", "ResolutionDueDate"] as const
  ).includes(sortByRaw as never)
    ? (sortByRaw as QueueState["sortBy"])
    : "CreatedDate";

  return {
    preset,
    status: params.getAll("status") as TicketStatus[],
    priority: one(params, "priority") as Priority | undefined,
    category: one(params, "category"),
    assignmentGroup: one(params, "assignmentGroup"),
    assignedAgentEmail: one(params, "assignedAgentEmail"),
    customerEmail: one(params, "customerEmail"),
    organization: one(params, "organization"),
    orderNumber: one(params, "orderNumber"),
    batchCode: one(params, "batchCode"),
    productSku: one(params, "productSku"),
    refundStatus: one(params, "refundStatus") as RefundStatus | undefined,
    createdFrom: one(params, "createdFrom"),
    createdTo: one(params, "createdTo"),
    sortBy,
    sortDesc: one(params, "sortDesc") !== "false",
    offset: Math.max(0, Number(one(params, "offset") ?? 0) || 0),
  };
}

export function serializeQueueState(state: QueueState): string {
  const params = new URLSearchParams();

  if (state.preset !== DEFAULT_PRESET) params.set("preset", state.preset);
  for (const s of state.status) params.append("status", s);

  const scalars: Array<[string, string | undefined]> = [
    ["priority", state.priority],
    ["category", state.category],
    ["assignmentGroup", state.assignmentGroup],
    ["assignedAgentEmail", state.assignedAgentEmail],
    ["customerEmail", state.customerEmail],
    ["organization", state.organization],
    ["orderNumber", state.orderNumber],
    ["batchCode", state.batchCode],
    ["productSku", state.productSku],
    ["refundStatus", state.refundStatus],
    ["createdFrom", state.createdFrom],
    ["createdTo", state.createdTo],
  ];
  for (const [key, value] of scalars) {
    if (value) params.set(key, value);
  }

  if (state.sortBy !== "CreatedDate") params.set("sortBy", state.sortBy);
  if (!state.sortDesc) params.set("sortDesc", "false");
  if (state.offset > 0) params.set("offset", String(state.offset));

  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Translates UI state into the API's query.
 *
 * `mine` needs the signed-in agent's address, which the URL deliberately does not carry —
 * the same link should mean "mine" for whoever opens it.
 */
export function toSearchQuery(state: QueueState, currentAgentEmail: string): TicketSearchQuery {
  const query: TicketSearchQuery = {
    priority: state.priority,
    category: state.category,
    assignmentGroup: state.assignmentGroup,
    assignedAgentEmail: state.assignedAgentEmail,
    customerEmail: state.customerEmail,
    organization: state.organization,
    orderNumber: state.orderNumber,
    batchCode: state.batchCode,
    productSku: state.productSku,
    refundStatus: state.refundStatus,
    createdFrom: state.createdFrom,
    createdTo: state.createdTo,
    limit: PAGE_SIZE,
    offset: state.offset,
    sortBy: state.sortBy,
    sortDesc: state.sortDesc,
  };

  switch (state.preset) {
    case "open":
      query.openOnly = true;
      break;
    case "unassigned":
      query.status = ["Not Assigned"];
      break;
    case "mine":
      query.openOnly = true;
      query.assignedAgentEmail = currentAgentEmail;
      break;
    case "breached":
      query.openOnly = true;
      query.breachedOnly = true;
      break;
    case "all":
      // An explicit status selection only applies when no preset is forcing one; the API
      // ignores `status` entirely when `openOnly` is set.
      if (state.status.length) query.status = state.status;
      break;
  }

  return query;
}

/** Filters beyond the preset, for the "N active" hint and the clear-all affordance. */
export function countActiveFilters(state: QueueState): number {
  const values = [
    state.priority,
    state.category,
    state.assignmentGroup,
    state.assignedAgentEmail,
    state.customerEmail,
    state.organization,
    state.orderNumber,
    state.batchCode,
    state.productSku,
    state.refundStatus,
    state.createdFrom,
    state.createdTo,
  ];
  return values.filter(Boolean).length + (state.preset === "all" ? state.status.length : 0);
}

export function emptyQueueState(preset: Preset = DEFAULT_PRESET): QueueState {
  return {
    preset,
    status: [],
    sortBy: "CreatedDate",
    sortDesc: true,
    offset: 0,
  };
}

/** True when the preset already pins the status, making the status picker meaningless. */
export function presetControlsStatus(preset: Preset): boolean {
  return preset !== "all";
}

export { OPEN_STATUSES };
