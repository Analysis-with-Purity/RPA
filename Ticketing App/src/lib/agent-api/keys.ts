import type { ExceptionSearchQuery, TicketSearchQuery } from "./types";

/**
 * Query keys for the agent console. Kept separate from the customer portal's `queryKeys`
 * so the two caches can never collide on an id.
 */
export const agentKeys = {
  all: ["agent"] as const,

  tickets: {
    all: ["agent", "tickets"] as const,
    list: (query: TicketSearchQuery) => ["agent", "tickets", "list", query] as const,
    detail: (id: string) => ["agent", "tickets", "detail", id] as const,
    comments: (id: string) => ["agent", "tickets", "detail", id, "comments"] as const,
    transitions: (id: string) => ["agent", "tickets", "detail", id, "transitions"] as const,
  },

  metrics: {
    all: ["agent", "metrics"] as const,
    summary: (since?: string) => ["agent", "metrics", "summary", since ?? null] as const,
    sla: ["agent", "metrics", "sla"] as const,
    workload: ["agent", "metrics", "workload"] as const,
    batches: ["agent", "metrics", "batches"] as const,
    intakeHealth: ["agent", "metrics", "intake-health"] as const,
  },

  exceptions: {
    all: ["agent", "exceptions"] as const,
    list: (query: ExceptionSearchQuery) => ["agent", "exceptions", "list", query] as const,
    detail: (id: string) => ["agent", "exceptions", "detail", id] as const,
  },

  config: ["agent", "config"] as const,
  health: ["agent", "health"] as const,
};
