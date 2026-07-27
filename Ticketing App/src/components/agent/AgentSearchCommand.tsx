"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BoxesIcon,
  GaugeIcon,
  HashIcon,
  InboxIcon,
  MailIcon,
  PackageIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAgentSession } from "@/lib/agent-api/session";

/**
 * Jump bar.
 *
 * The API has no free-text search — every ticket filter is an exact match on an indexed
 * column. So rather than pretending to search, this routes whatever you type to the lookup
 * that can actually answer it: a ticket id opens the ticket, anything else becomes a queue
 * filter on the field you pick.
 */
export function AgentSearchCommand() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const router = useRouter();
  const { hasRole } = useAgentSession();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const trimmed = term.trim();

  function go(href: string) {
    setOpen(false);
    setTerm("");
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
        <span className="hidden sm:inline">Jump to…</span>
        <CommandShortcut className="hidden sm:inline">⌘K</CommandShortcut>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Jump to"
        description="Open a ticket by id, or filter the queue by an exact field match."
      >
        <CommandInput
          placeholder="Ticket id, customer email, order number, batch code…"
          value={term}
          onValueChange={setTerm}
        />
        <CommandList>
          <CommandEmpty>Type a value to look it up.</CommandEmpty>

          {trimmed && (
            <>
              <CommandGroup heading={`Look up “${trimmed}”`}>
                <CommandItem
                  value={`ticket-${trimmed}`}
                  onSelect={() => go(`/agent/tickets/${encodeURIComponent(trimmed)}`)}
                >
                  <HashIcon />
                  Open ticket <span className="font-mono text-xs">{trimmed}</span>
                </CommandItem>
                <CommandItem
                  value={`email-${trimmed}`}
                  onSelect={() =>
                    go(`/agent/queue?customerEmail=${encodeURIComponent(trimmed)}`)
                  }
                >
                  <MailIcon />
                  Tickets from customer email
                </CommandItem>
                <CommandItem
                  value={`order-${trimmed}`}
                  onSelect={() => go(`/agent/queue?orderNumber=${encodeURIComponent(trimmed)}`)}
                >
                  <PackageIcon />
                  Tickets for order number
                </CommandItem>
                <CommandItem
                  value={`batch-${trimmed}`}
                  onSelect={() => go(`/agent/queue?batchCode=${encodeURIComponent(trimmed)}`)}
                >
                  <BoxesIcon />
                  Tickets for batch code
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Go to">
            <CommandItem value="queue" onSelect={() => go("/agent/queue")}>
              <InboxIcon /> Queue
            </CommandItem>
            <CommandItem value="unassigned" onSelect={() => go("/agent/queue?preset=unassigned")}>
              <InboxIcon /> Unassigned tickets
            </CommandItem>
            <CommandItem value="breached" onSelect={() => go("/agent/queue?preset=breached")}>
              <TriangleAlertIcon /> Breached SLA
            </CommandItem>
            <CommandItem value="dashboard" onSelect={() => go("/agent/dashboard")}>
              <GaugeIcon /> Dashboard
            </CommandItem>
            <CommandItem value="batches" onSelect={() => go("/agent/batches")}>
              <BoxesIcon /> Batch report
            </CommandItem>
            {hasRole("supervisor") && (
              <CommandItem value="exceptions" onSelect={() => go("/agent/exceptions")}>
                <TriangleAlertIcon /> Intake exceptions
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
