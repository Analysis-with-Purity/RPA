import type { Ticket, TicketStatus, TicketPriority, Message, ActivityEvent } from "@/lib/types";
import type { CreateTicketInput } from "@/lib/validations/ticket-schema";
import { apiFetch } from "./client";

export interface TicketListFilters {
  search?: string;
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  departmentId?: string | "all";
  sort?: "newest" | "oldest" | "priority";
}

function toQueryString(filters: TicketListFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.departmentId && filters.departmentId !== "all") {
    params.set("departmentId", filters.departmentId);
  }
  if (filters.sort) params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getTickets(filters: TicketListFilters = {}): Promise<Ticket[]> {
  const { tickets } = await apiFetch<{ tickets: Ticket[]; total: number }>(
    `/api/v1/tickets${toQueryString(filters)}`
  );
  return tickets;
}

export async function getTicketById(id: string): Promise<Ticket | undefined> {
  try {
    return await apiFetch<Ticket>(`/api/v1/tickets/${encodeURIComponent(id)}`);
  } catch {
    return undefined;
  }
}

export async function getMessages(ticketId: string): Promise<Message[]> {
  const { messages } = await apiFetch<{ messages: Message[]; total: number }>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/messages`
  );
  return messages;
}

export async function getActivity(ticketId: string): Promise<ActivityEvent[]> {
  const { activity } = await apiFetch<{ activity: ActivityEvent[]; total: number }>(
    `/api/v1/tickets/${encodeURIComponent(ticketId)}/activity`
  );
  return activity;
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return apiFetch<Ticket>("/api/v1/tickets", {
    method: "POST",
    body: JSON.stringify({
      subject: input.subject,
      description: input.description,
      categoryId: input.categoryId,
      departmentId: input.departmentId,
      priority: input.priority,
      tags: input.tags,
    }),
  });
}

export async function addMessage(ticketId: string, body: string): Promise<Message> {
  return apiFetch<Message>(`/api/v1/tickets/${encodeURIComponent(ticketId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ body, authorRole: "customer" }),
  });
}
