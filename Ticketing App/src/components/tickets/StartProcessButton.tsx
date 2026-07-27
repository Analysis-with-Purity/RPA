"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { Ticket } from "@/lib/types";

interface StartProcessResponse {
  ticketId: string;
  started: boolean;
  queue: string;
  queueItemId?: number;
  currentStatus: string;
  note?: string;
}

/**
 * TRIAGE TICKET — hands the ticket to the orchestration layer.
 *
 * The click only queues a command; the status changes when a robot picks it up seconds
 * later. So after a successful call the ticket queries are invalidated on a short delay to
 * pull the new state, and the button reports "queued", never "assigned" — claiming the
 * outcome before the automation has run would be a lie the UI can't back up.
 */
export function StartProcessButton({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();
  const [justQueued, setJustQueued] = useState(false);

  const terminal = ticket.status === "resolved" || ticket.status === "closed";

  const startProcess = useMutation({
    mutationFn: () =>
      apiFetch<StartProcessResponse>(
        `/api/v1/tickets/${encodeURIComponent(ticket.id)}/start-process`,
        { method: "POST", body: JSON.stringify({ requestedBy: "CodedApp" }) },
      ),
    onSuccess: (result) => {
      setJustQueued(true);
      toast.success(
        `Queued on ${result.queue}${result.queueItemId ? ` (item ${result.queueItemId})` : ""}. Watch the status update.`,
      );

      // The robot needs a moment. Refresh twice so the new status appears without the user
      // having to reload — once quickly, once after the trigger has realistically fired.
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticket.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.activity(ticket.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all });
      };
      window.setTimeout(refresh, 3_000);
      window.setTimeout(refresh, 12_000);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Button
      onClick={() => startProcess.mutate()}
      disabled={startProcess.isPending || terminal}
      title={
        terminal
          ? `This ticket is ${ticket.status}. Reopen it before starting the process again.`
          : "Queue this ticket for triage and automatic assignment"
      }
      className="gap-2"
    >
      {startProcess.isPending ? (
        <>
          <LoaderCircleIcon className="size-4 animate-spin" /> Startingâ€¦
        </>
      ) : (
        <>
          <PlayIcon className="size-4" />
          {justQueued ? "Start process again" : "Start process"}
        </>
      )}
    </Button>
  );
}
