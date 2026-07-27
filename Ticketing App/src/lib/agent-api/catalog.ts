/**
 * Reference data mirrored from the Support Desk API's `src/config/catalog.ts`.
 *
 * The API is the authority — it serves the same values from `GET /api/config`, and
 * `useDeskConfig()` prefers that copy at runtime. These constants exist so the console can
 * type its filters and render its dropdowns without a round trip, and so a transition button
 * can be disabled before the server would reject it.
 *
 * If the two ever disagree, the server wins: it is what validates the request.
 */

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CHANNELS = ["Web", "Email", "Phone", "Chat", "Social", "Boutique"] as const;
export type Channel = (typeof CHANNELS)[number];

export const PURCHASE_CHANNELS = [
  "Website",
  "Amazon",
  "Boutique",
  "DepartmentStore",
  "Wholesale",
  "Gift",
  "Other",
] as const;
export type PurchaseChannel = (typeof PURCHASE_CHANNELS)[number];

export const REFUND_STATUSES = [
  "None",
  "Requested",
  "Approved",
  "Processed",
  "Rejected",
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const STATUSES = [
  "Not Assigned",
  "Assigned",
  "In Progress",
  "Waiting on Customer",
  "Resolved",
  "Closed",
  "Cancelled",
] as const;
export type TicketStatus = (typeof STATUSES)[number];

/** The four statuses an agent counts as live work. */
export const OPEN_STATUSES: TicketStatus[] = [
  "Not Assigned",
  "Assigned",
  "In Progress",
  "Waiting on Customer",
];

/**
 * Client-side copy of the lifecycle. Used only to grey out impossible actions early — the
 * authoritative list for a given ticket comes from `GET /tickets/:id/transitions`.
 */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  "Not Assigned": ["Assigned", "In Progress", "Cancelled"],
  Assigned: ["In Progress", "Waiting on Customer", "Resolved", "Not Assigned", "Cancelled"],
  "In Progress": ["Waiting on Customer", "Resolved", "Assigned", "Cancelled"],
  "Waiting on Customer": ["In Progress", "Resolved", "Cancelled"],
  Resolved: ["Closed", "In Progress"],
  Closed: ["In Progress"],
  Cancelled: [],
};

export const ROLES = ["agent", "supervisor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface CategoryDef {
  name: string;
  subcategories: string[];
  minimumPriority: Priority | null;
  requiresBatchCode: boolean;
  productRelevant: boolean;
  orderRelevant: boolean;
}

export interface SlaPolicy {
  name: string;
  priority: Priority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

/** Shape of `GET /api/config`. */
export interface DeskConfig {
  brand: string;
  priorities: readonly Priority[];
  channels: readonly Channel[];
  purchaseChannels: readonly PurchaseChannel[];
  categories: CategoryDef[];
  slaPolicies: SlaPolicy[];
  limits: {
    subject: number;
    description: number;
    customerEmail: number;
    attachmentReferences: number;
  };
  notes: string[];
}

// ---------------------------------------------------------------- display helpers

/**
 * Visual weight per status. Blue is the brand hue, so progression is carried by tone
 * (outline → tint → solid) and the semantic colours are reserved for outcomes.
 */
export const STATUS_TONE: Record<
  TicketStatus,
  "neutral" | "info" | "active" | "waiting" | "good" | "muted" | "dead"
> = {
  "Not Assigned": "neutral",
  Assigned: "info",
  "In Progress": "active",
  "Waiting on Customer": "waiting",
  Resolved: "good",
  Closed: "muted",
  Cancelled: "dead",
};

export const PRIORITY_RANK: Record<Priority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3,
};

export function isOpen(status: TicketStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
