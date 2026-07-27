import type { Department } from "@/lib/types";

export const DEPARTMENTS: Department[] = [
  { id: "dept-support", name: "Customer Support" },
  { id: "dept-billing", name: "Billing" },
  { id: "dept-engineering", name: "Engineering" },
  { id: "dept-sales", name: "Sales" },
];

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
