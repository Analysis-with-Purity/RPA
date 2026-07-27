import type { TicketListFilters } from "@/lib/api/tickets";

export const queryKeys = {
  tickets: {
    all: ["tickets"] as const,
    list: (filters: TicketListFilters) => ["tickets", "list", filters] as const,
    detail: (id: string) => ["tickets", "detail", id] as const,
    messages: (id: string) => ["tickets", "detail", id, "messages"] as const,
    activity: (id: string) => ["tickets", "detail", id, "activity"] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
  },
  meta: {
    categories: ["meta", "categories"] as const,
    departments: ["meta", "departments"] as const,
    agents: ["meta", "agents"] as const,
  },
  ai: {
    category: (text: string) => ["ai", "category", text] as const,
    duplicates: (subject: string, description: string) =>
      ["ai", "duplicates", subject, description] as const,
    solution: (categoryId: string) => ["ai", "solution", categoryId] as const,
  },
};
