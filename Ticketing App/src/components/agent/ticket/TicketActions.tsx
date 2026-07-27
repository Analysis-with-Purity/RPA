"use client";

import { useState } from "react";
import {
  ArrowUpIcon,
  CircleCheckIcon,
  LoaderCircleIcon,
  UserPlusIcon,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITIES, type Priority } from "@/lib/agent-api/catalog";
import {
  useAgentSession,
  useAssignTicket,
  useChangeStatus,
  useClaimTicket,
  useCloseTicket,
  useEscalateTicket,
  useResolveTicket,
  useTicketTransitions,
} from "@/lib/agent-api/hooks";
import type { TicketDto } from "@/lib/agent-api/types";

export function TicketActions({ ticket }: { ticket: TicketDto }) {
  const { session, hasRole } = useAgentSession();
  const transitions = useTicketTransitions(ticket.ticketId);

  const claim = useClaimTicket(ticket.ticketId);
  const changeStatus = useChangeStatus(ticket.ticketId);

  const isSupervisor = hasRole("supervisor");
  const isMine = ticket.assignment.agentEmail === session?.subject;
  const allowed = transitions.data?.allowedStatuses ?? [];
  const canResolve = allowed.includes("Resolved");
  const canClose = allowed.includes("Closed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {!isMine && ticket.status !== "Cancelled" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={claim.isPending}
              onClick={() => claim.mutate()}
            >
              <UserPlusIcon className="size-4" />
              {claim.isPending ? "Claiming…" : "Claim"}
            </Button>
          )}

          <AssignDialog ticket={ticket} />

          {canResolve && <ResolveDialog ticket={ticket} />}
          {canClose && <CloseDialog ticket={ticket} />}
          {isSupervisor && ticket.status !== "Cancelled" && (
            <EscalateDialog ticket={ticket} />
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Move to status</Label>

          {transitions.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : allowed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {ticket.status === "Cancelled"
                ? "A cancelled ticket is terminal — there is nowhere left to move it."
                : "No transitions available."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allowed
                // Resolve and Close have dedicated dialogs above; they need extra fields.
                .filter((status) => status !== "Resolved" && status !== "Closed")
                .map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    disabled={changeStatus.isPending}
                    onClick={() => changeStatus.mutate({ status })}
                  >
                    {changeStatus.isPending ? (
                      <LoaderCircleIcon className="size-3.5 animate-spin" />
                    ) : null}
                    {status}
                  </Button>
                ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Only transitions the API will accept from{" "}
            <span className="font-medium">{ticket.status}</span> are shown.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------------ assign

function AssignDialog({ ticket }: { ticket: TicketDto }) {
  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState(ticket.assignment.agent ?? "");
  const [agentEmail, setAgentEmail] = useState(ticket.assignment.agentEmail ?? "");
  const [assignmentGroup, setAssignmentGroup] = useState(ticket.assignment.group ?? "");
  const [note, setNote] = useState("");
  const assign = useAssignTicket(ticket.ticketId);

  async function submit() {
    await assign.mutateAsync({
      agentName: agentName.trim(),
      agentEmail: agentEmail.trim(),
      assignmentGroup: assignmentGroup.trim() || undefined,
      note: note.trim() || undefined,
    });
    setOpen(false);
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <UserPlusIcon className="size-4" />
          Assign
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign ticket</DialogTitle>
          <DialogDescription>
            Hands the ticket to a named agent and records the change on the timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="assign-name">Agent name</Label>
            <Input
              id="assign-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Rae Whitfield"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assign-email">Agent email</Label>
            <Input
              id="assign-email"
              type="email"
              value={agentEmail}
              onChange={(e) => setAgentEmail(e.target.value)}
              placeholder="rae.whitfield@maisonfragrance.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assign-group">Assignment group</Label>
            <Input
              id="assign-group"
              value={assignmentGroup}
              onChange={(e) => setAssignmentGroup(e.target.value)}
              placeholder="Logistics"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assign-note">Note</Label>
            <Textarea
              id="assign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional — added as an internal note."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!agentName.trim() || !agentEmail.trim() || assign.isPending}
            onClick={() => void submit()}
          >
            {assign.isPending ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------- resolve

function ResolveDialog({ ticket }: { ticket: TicketDto }) {
  const [open, setOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [customerReply, setCustomerReply] = useState("");
  const resolve = useResolveTicket(ticket.ticketId);

  async function submit() {
    await resolve.mutateAsync({
      resolutionNotes: resolutionNotes.trim(),
      customerReply: customerReply.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <CircleCheckIcon className="size-4" />
          Resolve
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve ticket</DialogTitle>
          <DialogDescription>
            Stops the resolution clock and lets the customer rate the outcome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="resolution-notes">Resolution notes</Label>
            <Textarea
              id="resolution-notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="What was wrong and what you did about it. Internal record."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-reply">Reply to customer</Label>
            <Textarea
              id="customer-reply"
              value={customerReply}
              onChange={(e) => setCustomerReply(e.target.value)}
              rows={3}
              maxLength={10_000}
              placeholder="Optional — posted to the customer as a visible reply."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!resolutionNotes.trim() || resolve.isPending} onClick={() => void submit()}>
            {resolve.isPending ? "Resolving…" : "Resolve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------------- close

function CloseDialog({ ticket }: { ticket: TicketDto }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [csat, setCsat] = useState<string>("");
  const close = useCloseTicket(ticket.ticketId);

  async function submit() {
    await close.mutateAsync({
      note: note.trim() || undefined,
      csatScore: csat ? Number(csat) : undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <XCircleIcon className="size-4" />
          Close
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close ticket</DialogTitle>
          <DialogDescription>
            Closing is final for reporting, though the API still allows a reopen to In
            Progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="close-note">Closing note</Label>
            <Textarea
              id="close-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="close-csat">Satisfaction score</Label>
            <Select value={csat} onValueChange={setCsat}>
              <SelectTrigger id="close-csat" className="w-full">
                <SelectValue placeholder="Not recorded" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / 5
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only set this if the customer told you directly — they can rate it themselves
              from the portal.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={close.isPending} onClick={() => void submit()}>
            {close.isPending ? "Closing…" : "Close ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------- escalate

function EscalateDialog({ ticket }: { ticket: TicketDto }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [raisePriorityTo, setRaisePriorityTo] = useState<string>("");
  const [assignmentGroup, setAssignmentGroup] = useState("");
  const escalate = useEscalateTicket(ticket.ticketId);

  async function submit() {
    await escalate.mutateAsync({
      reason: reason.trim(),
      raisePriorityTo: (raisePriorityTo || undefined) as Priority | undefined,
      assignmentGroup: assignmentGroup.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 text-destructive">
          <ArrowUpIcon className="size-4" />
          Escalate
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalate ticket</DialogTitle>
          <DialogDescription>
            Raises the escalation level
            {ticket.sla.escalationLevel > 0
              ? ` from ${ticket.sla.escalationLevel} to ${ticket.sla.escalationLevel + 1}`
              : " to 1"}
            . Supervisor action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="escalate-reason">Reason</Label>
            <Textarea
              id="escalate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Why this needs more attention than the queue gives it."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="escalate-priority">Raise priority to</Label>
            <Select value={raisePriorityTo} onValueChange={setRaisePriorityTo}>
              <SelectTrigger id="escalate-priority" className="w-full">
                <SelectValue placeholder="Leave unchanged" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="escalate-group">Reroute to group</Label>
            <Input
              id="escalate-group"
              value={assignmentGroup}
              onChange={(e) => setAssignmentGroup(e.target.value)}
              placeholder="Optional — e.g. Product Safety"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || escalate.isPending}
            onClick={() => void submit()}
          >
            {escalate.isPending ? "Escalating…" : "Escalate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
