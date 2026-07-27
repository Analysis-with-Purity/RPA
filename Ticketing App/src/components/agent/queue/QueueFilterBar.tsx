"use client";

import { useState } from "react";
import { FilterIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  PRIORITIES,
  REFUND_STATUSES,
  STATUSES,
  type Priority,
  type RefundStatus,
} from "@/lib/agent-api/catalog";
import { useDeskConfig } from "@/lib/agent-api/hooks";
import {
  PRESET_LABELS,
  PRESETS,
  countActiveFilters,
  emptyQueueState,
  presetControlsStatus,
  type Preset,
  type QueueState,
} from "./filters";

/** Sentinel for "no filter" — Radix Select cannot hold an empty-string value. */
const ANY = "__any__";

interface QueueFilterBarProps {
  state: QueueState;
  onChange: (next: QueueState) => void;
  total?: number;
}

export function QueueFilterBar({ state, onChange, total }: QueueFilterBarProps) {
  const [open, setOpen] = useState(false);
  const config = useDeskConfig();
  const activeCount = countActiveFilters(state);

  /** Every filter edit resets paging — page 3 of the old filter is meaningless. */
  const patch = (partial: Partial<QueueState>) =>
    onChange({ ...state, ...partial, offset: 0 });

  const categories = config.data?.categories ?? [];
  const assignmentGroups = Array.from(
    new Set(
      categories
        .map((c) => c.name)
        .concat(["Logistics", "Quality Assurance", "Brand Protection", "Product Safety"]),
    ),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          value={state.preset}
          onValueChange={(value: string) => {
            if (!value) return;
            patch({ preset: value as Preset, status: [] });
          }}
        >
          {PRESETS.map((preset) => (
            <ToggleGroupItem
              key={preset}
              value={preset}
              className="data-[state=on]:bg-primary-muted data-[state=on]:text-primary"
            >
              {PRESET_LABELS[preset]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FilterIcon className="size-4" />
              Filters
              {activeCount > 0 && (
                <Badge variant="info" className="ml-1 px-1.5 text-[10px]">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-[22rem] space-y-4">
            {presetControlsStatus(state.preset) ? (
              <p className="rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
                The <span className="font-medium">{PRESET_LABELS[state.preset]}</span> preset
                already pins the status. Switch to <span className="font-medium">All</span> to
                choose statuses yourself.
              </p>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((status) => {
                    const selected = state.status.includes(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          patch({
                            status: selected
                              ? state.status.filter((s) => s !== status)
                              : [...state.status, status],
                          })
                        }
                        className={
                          selected
                            ? "rounded-full border border-primary bg-primary-muted px-2.5 py-1 text-xs text-primary"
                            : "rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                        }
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <SelectField
              label="Priority"
              value={state.priority}
              options={PRIORITIES}
              onChange={(v) => patch({ priority: v as Priority | undefined })}
            />

            <SelectField
              label="Category"
              value={state.category}
              options={categories.map((c) => c.name)}
              onChange={(v) => patch({ category: v })}
            />

            <SelectField
              label="Assignment group"
              value={state.assignmentGroup}
              options={assignmentGroups}
              onChange={(v) => patch({ assignmentGroup: v })}
            />

            <SelectField
              label="Refund status"
              value={state.refundStatus}
              options={REFUND_STATUSES}
              onChange={(v) => patch({ refundStatus: v as RefundStatus | undefined })}
            />

            <TextField
              label="Assigned agent email"
              placeholder="agent@maisonfragrance.com"
              value={state.assignedAgentEmail}
              onCommit={(v) => patch({ assignedAgentEmail: v })}
            />

            <TextField
              label="Customer email"
              placeholder="customer@example.com"
              value={state.customerEmail}
              onCommit={(v) => patch({ customerEmail: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Order number"
                value={state.orderNumber}
                onCommit={(v) => patch({ orderNumber: v })}
              />
              <TextField
                label="Batch code"
                value={state.batchCode}
                onCommit={(v) => patch({ batchCode: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Created from</Label>
                <Input
                  type="date"
                  value={state.createdFrom?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    patch({ createdFrom: e.target.value ? e.target.value : undefined })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Created to</Label>
                <Input
                  type="date"
                  value={state.createdTo?.slice(0, 10) ?? ""}
                  onChange={(e) =>
                    patch({ createdTo: e.target.value ? e.target.value : undefined })
                  }
                />
              </div>
            </div>

            <div className="flex justify-between border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(emptyQueueState(state.preset))}
                disabled={activeCount === 0}
              >
                Clear filters
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {typeof total === "number" && (
          <span className="ml-auto text-sm text-muted-foreground">
            {total.toLocaleString()} {total === 1 ? "ticket" : "tickets"}
          </span>
        )}
      </div>

      {activeCount > 0 && (
        <ActiveChips state={state} onChange={onChange} />
      )}
    </div>
  );
}

function ActiveChips({
  state,
  onChange,
}: {
  state: QueueState;
  onChange: (next: QueueState) => void;
}) {
  const chips: Array<{ label: string; clear: Partial<QueueState> }> = [];

  const add = (label: string, value: string | undefined, key: keyof QueueState) => {
    if (value) chips.push({ label: `${label}: ${value}`, clear: { [key]: undefined } });
  };

  add("Priority", state.priority, "priority");
  add("Category", state.category, "category");
  add("Group", state.assignmentGroup, "assignmentGroup");
  add("Agent", state.assignedAgentEmail, "assignedAgentEmail");
  add("Customer", state.customerEmail, "customerEmail");
  add("Org", state.organization, "organization");
  add("Order", state.orderNumber, "orderNumber");
  add("Batch", state.batchCode, "batchCode");
  add("SKU", state.productSku, "productSku");
  add("Refund", state.refundStatus, "refundStatus");
  add("From", state.createdFrom?.slice(0, 10), "createdFrom");
  add("To", state.createdTo?.slice(0, 10), "createdTo");

  if (state.preset === "all") {
    for (const status of state.status) {
      chips.push({
        label: `Status: ${status}`,
        clear: { status: state.status.filter((s) => s !== status) },
      });
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChange({ ...state, ...chip.clear, offset: 0 })}
          className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
        >
          {chip.label}
          <XIcon className="size-3" />
        </button>
      ))}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value ?? ANY}
        onValueChange={(v) => onChange(v === ANY ? undefined : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Any ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Text filters commit on blur or Enter rather than per keystroke — each change refires the
 * search, and the API matches exactly, so a partial value returns nothing anyway.
 */
function TextField({
  label,
  placeholder,
  value,
  onCommit,
}: {
  label: string;
  placeholder?: string;
  value: string | undefined;
  onCommit: (value: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft.trim() || undefined)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit(draft.trim() || undefined);
          }
        }}
      />
    </div>
  );
}
