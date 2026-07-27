"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

export function TagInput({ value, onChange, max = 8 }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const tag = draft.trim().toLowerCase();
    setDraft("");
    if (!tag) return;
    if (value.includes(tag) || value.length >= max) return;
    onChange([...value, tag]);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input px-3 py-2 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="rounded-full hover:text-destructive"
            aria-label={`Remove tag ${tag}`}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commitDraft();
          }
          if (e.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commitDraft}
        placeholder={value.length >= max ? "" : "Add a tag..."}
        disabled={value.length >= max}
        className="h-auto flex-1 border-none px-0 py-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
