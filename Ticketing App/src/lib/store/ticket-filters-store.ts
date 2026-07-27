import { create } from "zustand";
import type { TicketStatus, TicketPriority } from "@/lib/types";

interface TicketFiltersState {
  search: string;
  status: TicketStatus | "all";
  priority: TicketPriority | "all";
  departmentId: string;
  sort: "newest" | "oldest" | "priority";
  setSearch: (search: string) => void;
  setStatus: (status: TicketStatus | "all") => void;
  setPriority: (priority: TicketPriority | "all") => void;
  setDepartmentId: (departmentId: string) => void;
  setSort: (sort: "newest" | "oldest" | "priority") => void;
  reset: () => void;
}

const DEFAULTS = {
  search: "",
  status: "all" as const,
  priority: "all" as const,
  departmentId: "all",
  sort: "newest" as const,
};

export const useTicketFiltersStore = create<TicketFiltersState>((set) => ({
  ...DEFAULTS,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setPriority: (priority) => set({ priority }),
  setDepartmentId: (departmentId) => set({ departmentId }),
  setSort: (sort) => set({ sort }),
  reset: () => set(DEFAULTS),
}));
