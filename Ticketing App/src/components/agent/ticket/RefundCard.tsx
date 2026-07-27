"use client";

import { useState } from "react";
import { BanknoteIcon, CheckIcon, LockIcon, XIcon } from "lucide-react";

import { RefundBadge } from "@/components/agent/badges";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAgentSession,
  useDecideRefund,
  useRequestRefund,
  useSettleRefund,
} from "@/lib/agent-api/hooks";
import type { TicketDto } from "@/lib/agent-api/types";

/**
 * Refund lifecycle: None → Requested → Approved | Rejected → Processed.
 *
 * An agent may request; only a supervisor may decide or settle. The API enforces this — the
 * role checks here just avoid showing a button that would come back 403.
 */
export function RefundCard({ ticket }: { ticket: TicketDto }) {
  const { hasRole } = useAgentSession();
  const isSupervisor = hasRole("supervisor");

  const status = ticket.refund.status ?? "None";
  const amount = ticket.refund.amount;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BanknoteIcon className="size-4" />
          Refund
        </CardTitle>
        {status !== "None" ? (
          <RefundBadge status={status} amount={amount} />
        ) : (
          <span className="text-xs text-muted-foreground">None requested</span>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {status === "None" && (
          <>
            <p className="text-sm text-muted-foreground">
              No refund on this ticket.
            </p>
            <RequestDialog ticket={ticket} />
          </>
        )}

        {status === "Requested" && (
          <>
            <p className="text-sm">
              <span className="font-medium">{amount?.toFixed(2) ?? "—"}</span> requested,
              awaiting a supervisor decision.
            </p>
            {isSupervisor ? (
              <div className="flex gap-2">
                <DecisionDialog ticket={ticket} decision="Approved" />
                <DecisionDialog ticket={ticket} decision="Rejected" />
              </div>
            ) : (
              <SupervisorOnlyNote action="approve or reject a refund" />
            )}
          </>
        )}

        {status === "Approved" && (
          <>
            <p className="text-sm">
              <span className="font-medium">{amount?.toFixed(2) ?? "—"}</span> approved.
              Mark it processed once the payment has actually gone out.
            </p>
            {isSupervisor ? (
              <SettleDialog ticket={ticket} />
            ) : (
              <SupervisorOnlyNote action="settle a refund" />
            )}
          </>
        )}

        {status === "Processed" && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{amount?.toFixed(2) ?? "—"}</span>{" "}
            refunded to the customer.
          </p>
        )}

        {status === "Rejected" && (
          <>
            <p className="text-sm text-muted-foreground">
              The refund request was rejected.
            </p>
            <RequestDialog ticket={ticket} label="Request again" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SupervisorOnlyNote({ action }: { action: string }) {
  return (
    <p className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
      <LockIcon className="size-3.5" />
      You need the supervisor role to {action}.
    </p>
  );
}

function RequestDialog({ ticket, label = "Request refund" }: { ticket: TicketDto; label?: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const request = useRequestRefund(ticket.ticketId);

  const parsed = Number(amount);
  const valid = amount !== "" && Number.isFinite(parsed) && parsed >= 0 && reason.trim() !== "";

  async function submit() {
    await request.mutateAsync({ amount: parsed, reason: reason.trim() });
    setOpen(false);
    setAmount("");
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <BanknoteIcon className="size-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a refund</DialogTitle>
          <DialogDescription>
            Puts the refund in front of a supervisor. It is not money out until they approve
            and settle it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Amount</Label>
            <Input
              id="refund-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Why the customer is owed this."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || request.isPending} onClick={() => void submit()}>
            {request.isPending ? "Requesting…" : "Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DecisionDialog({
  ticket,
  decision,
}: {
  ticket: TicketDto;
  decision: "Approved" | "Rejected";
}) {
  const [open, setOpen] = useState(false);
  // Pre-filled with what was requested; a supervisor may approve a different figure.
  const [amount, setAmount] = useState(ticket.refund.amount?.toString() ?? "");
  const [note, setNote] = useState("");
  const decide = useDecideRefund(ticket.ticketId);

  const approving = decision === "Approved";
  const parsed = Number(amount);

  async function submit() {
    await decide.mutateAsync({
      decision,
      amount: approving && amount !== "" && Number.isFinite(parsed) ? parsed : undefined,
      note: note.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={approving ? "default" : "outline"}
          className={approving ? "gap-2" : "gap-2 text-destructive"}
        >
          {approving ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
          {approving ? "Approve" : "Reject"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approving ? "Approve refund" : "Reject refund"}</DialogTitle>
          <DialogDescription>
            {approving
              ? "Approving authorises the amount. Settling it separately records that the money actually moved."
              : "The requesting agent will see the rejection on the ticket timeline."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {approving && (
            <div className="space-y-1.5">
              <Label htmlFor="decision-amount">Approved amount</Label>
              <Input
                id="decision-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Requested: {ticket.refund.amount?.toFixed(2) ?? "—"}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="decision-note">Note</Label>
            <Textarea
              id="decision-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Optional."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={approving ? "default" : "destructive"}
            disabled={decide.isPending}
            onClick={() => void submit()}
          >
            {decide.isPending ? "Saving…" : approving ? "Approve" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettleDialog({ ticket }: { ticket: TicketDto }) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const settle = useSettleRefund(ticket.ticketId);

  async function submit() {
    await settle.mutateAsync({
      reference: reference.trim() || undefined,
      note: note.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <CheckIcon className="size-4" />
          Mark processed
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark refund processed</DialogTitle>
          <DialogDescription>
            Records that {ticket.refund.amount?.toFixed(2) ?? "the refund"} has been paid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="settle-reference">Payment reference</Label>
            <Input
              id="settle-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Gateway or bank reference"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settle-note">Note</Label>
            <Textarea
              id="settle-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={settle.isPending} onClick={() => void submit()}>
            {settle.isPending ? "Saving…" : "Mark processed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
