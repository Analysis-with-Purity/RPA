import type { Category } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { id: "cat-technical", name: "Technical Issue", description: "Bugs, errors, and things that aren't working" },
  { id: "cat-billing", name: "Billing & Payments", description: "Invoices, charges, refunds, and subscriptions" },
  { id: "cat-account", name: "Account Access", description: "Login, password, and permission problems" },
  { id: "cat-feature", name: "Feature Request", description: "Ideas and requests for new functionality" },
  { id: "cat-bug", name: "Bug Report", description: "Something is broken or behaving unexpectedly" },
  { id: "cat-general", name: "General Inquiry", description: "Anything else" },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
