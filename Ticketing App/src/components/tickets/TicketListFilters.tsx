"use client";

import { SearchIcon, XIcon } from "lucide-react";

import { useTicketFiltersStore } from "@/lib/store/ticket-filters-store";
import { useDepartments } from "@/lib/query/useMeta";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/constants";
import type { TicketStatus, TicketPriority } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG) as [TicketStatus, (typeof STATUS_CONFIG)[TicketStatus]][];
const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG) as [TicketPriority, (typeof PRIORITY_CONFIG)[TicketPriority]][];

export function TicketListFilters() {
  const {
    search,
    status,
    priority,
    departmentId,
    sort,
    setSearch,
    setStatus,
    setPriority,
    setDepartmentId,
    setSort,
    reset,
  } = useTicketFiltersStore();
  const departmentsQuery = useDepartments();

  const hasActiveFilters =
    search !== "" || status !== "all" || priority !== "all" || departmentId !== "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-56">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by subject, ID or tag..."
          className="pl-8"
        />
      </div>

      <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus | "all")}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUS_OPTIONS.map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority | "all")}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITY_OPTIONS.map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={departmentId} onValueChange={setDepartmentId}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departmentsQuery.data?.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
          <XIcon /> Clear
        </Button>
      )}
    </div>
  );
}
