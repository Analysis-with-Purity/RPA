export type TicketStatus =
  | "submitted"
  | "assigned"
  | "in_progress"
  | "awaiting_customer"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketRequester {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string;
  departmentId: string;
  tags: string[];
  requester: TicketRequester;
  assignedAgentId?: string;
  attachmentIds: string[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  firstResponseAt?: string;
  satisfactionRating?: 1 | 2 | 3 | 4 | 5;
  slaBreached?: boolean;
}

export const TICKET_STATUS_ORDER: TicketStatus[] = [
  "submitted",
  "assigned",
  "in_progress",
  "awaiting_customer",
  "resolved",
  "closed",
];
