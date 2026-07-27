"use client";

import { useState } from "react";
import {
  BuildingIcon,
  MailIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
  SparklesIcon,
  TimerIcon,
} from "lucide-react";

import { formatMinutes } from "@/components/agent/badges";
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
import { cn } from "@/lib/utils";
import { PRIORITIES, PURCHASE_CHANNELS, type Priority, type PurchaseChannel } from "@/lib/agent-api/catalog";
import { useDeskConfig, useUpdateTicket } from "@/lib/agent-api/hooks";
import type { TicketDto, UpdateTicketInput } from "@/lib/agent-api/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words", mono && "font-mono text-xs")}>
        {value === null || value === undefined || value === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function TicketDetailsPanel({ ticket }: { ticket: TicketDto }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MailIcon className="size-4" />
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <Row label="Name" value={ticket.customer.name} />
            <Row
              label="Email"
              value={
                ticket.customer.email ? (
                  <a
                    href={`mailto:${ticket.customer.email}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {ticket.customer.email}
                  </a>
                ) : null
              }
            />
            <Row
              label="Phone"
              value={
                ticket.customer.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 text-muted-foreground" />
                    {ticket.customer.phone}
                  </span>
                ) : null
              }
            />
            <Row
              label="Organisation"
              value={
                ticket.customer.organization ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BuildingIcon className="size-3.5 text-muted-foreground" />
                    {ticket.customer.organization}
                  </span>
                ) : null
              }
            />
            <Row label="Department" value={ticket.customer.department} />
            <Row label="Channel" value={ticket.channel} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageIcon className="size-4" />
            Order &amp; product
          </CardTitle>
          <EditFieldsDialog ticket={ticket} />
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <Row label="Order number" value={ticket.commerce.orderNumber} mono />
            <Row label="Product" value={ticket.commerce.productName} />
            <Row label="SKU" value={ticket.commerce.productSku} mono />
            <Row label="Batch code" value={ticket.commerce.batchCode} mono />
            <Row label="Purchase channel" value={ticket.commerce.purchaseChannel} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TimerIcon className="size-4" />
            SLA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <Row label="First response due" value={formatDate(ticket.sla.firstResponseDue)} />
            <Row
              label="First response"
              value={
                ticket.sla.firstResponseAt ? (
                  <span className={ticket.sla.firstResponseBreached ? "text-destructive" : undefined}>
                    {formatDate(ticket.sla.firstResponseAt)}
                    {ticket.sla.firstResponseBreached && " (late)"}
                  </span>
                ) : ticket.sla.firstResponseBreached ? (
                  <span className="text-destructive">Overdue, still unanswered</span>
                ) : (
                  <span className="text-muted-foreground">Not yet answered</span>
                )
              }
            />
            <Row label="Resolution due" value={formatDate(ticket.sla.resolutionDue)} />
            <Row
              label="Time to due"
              value={
                ticket.sla.minutesToResolutionDue === null ? null : (
                  <span
                    className={
                      ticket.sla.resolutionBreached ? "text-destructive" : undefined
                    }
                  >
                    {ticket.sla.minutesToResolutionDue < 0
                      ? `${formatMinutes(ticket.sla.minutesToResolutionDue)} overdue`
                      : `${formatMinutes(ticket.sla.minutesToResolutionDue)} remaining`}
                  </span>
                )
              }
            />
            <Row label="Resolved" value={formatDate(ticket.resolution.resolutionDate)} />
            <Row label="Closed" value={formatDate(ticket.resolution.closedDate)} />
            <Row
              label="Escalation level"
              value={ticket.sla.escalationLevel > 0 ? ticket.sla.escalationLevel : null}
            />
            <Row
              label="CSAT"
              value={
                ticket.resolution.csatScore !== null
                  ? `${ticket.resolution.csatScore} / 5`
                  : null
              }
            />
          </dl>
        </CardContent>
      </Card>

      {ticket.resolution.resolutionNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{ticket.resolution.resolutionNotes}</p>
          </CardContent>
        </Card>
      )}

      <IntelligenceCard ticket={ticket} />
      <AuditCard ticket={ticket} />
    </div>
  );
}

/**
 * The automation's own read on the ticket. Shown as advisory rather than authoritative —
 * these fields never drive routing on their own.
 */
function IntelligenceCard({ ticket }: { ticket: TicketDto }) {
  const { aiCategory, aiConfidence, sentimentLabel, sentimentScore, recommendedAgent } =
    ticket.intelligence;

  const hasAny =
    aiCategory || aiConfidence !== null || sentimentLabel || sentimentScore !== null || recommendedAgent;
  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SparklesIcon className="size-4" />
          Automation read
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          <Row
            label="Suggested category"
            value={
              aiCategory
                ? `${aiCategory}${aiConfidence !== null ? ` (${Math.round(aiConfidence * 100)}%)` : ""}`
                : null
            }
          />
          <Row
            label="Sentiment"
            value={
              sentimentLabel
                ? `${sentimentLabel}${sentimentScore !== null ? ` (${sentimentScore})` : ""}`
                : null
            }
          />
          <Row label="Recommended agent" value={recommendedAgent} />
        </dl>
      </CardContent>
    </Card>
  );
}

function AuditCard({ ticket }: { ticket: TicketDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Provenance</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          <Row label="Ticket id" value={ticket.ticketId} mono />
          <Row label="Record id" value={ticket.recordId} mono />
          <Row label="Source system" value={ticket.sourceSystem} />
          <Row label="Queue reference" value={ticket.audit.queueItemReference} mono />
          <Row label="Workflow instance" value={ticket.audit.workflowInstanceId} mono />
          <Row label="Intake attempts" value={ticket.audit.processingAttempts} />
          <Row label="Ingested" value={formatDate(ticket.ingestedAt)} />
          <Row label="Created" value={formatDate(ticket.createdDate)} />
          <Row label="Last updated" value={formatDate(ticket.audit.updateTime)} />
          {ticket.audit.lastErrorDetails && (
            <Row
              label="Last error"
              value={
                <span className="text-destructive">{ticket.audit.lastErrorDetails}</span>
              }
            />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------------- inline edit

const NONE = "__none__";

/**
 * PATCH /tickets/:id accepts a specific subset of fields — notably not status, which has
 * its own transition-checked route. Only that subset is offered here.
 */
function EditFieldsDialog({ ticket }: { ticket: TicketDto }) {
  const [open, setOpen] = useState(false);
  const config = useDeskConfig();
  const update = useUpdateTicket(ticket.ticketId);

  const [priority, setPriority] = useState<string>(ticket.priority ?? NONE);
  const [category, setCategory] = useState<string>(ticket.category ?? NONE);
  const [subcategory, setSubcategory] = useState<string>(ticket.subcategory ?? NONE);
  const [orderNumber, setOrderNumber] = useState(ticket.commerce.orderNumber ?? "");
  const [productSku, setProductSku] = useState(ticket.commerce.productSku ?? "");
  const [productName, setProductName] = useState(ticket.commerce.productName ?? "");
  const [batchCode, setBatchCode] = useState(ticket.commerce.batchCode ?? "");
  const [purchaseChannel, setPurchaseChannel] = useState<string>(
    ticket.commerce.purchaseChannel ?? NONE,
  );

  const categories = config.data?.categories ?? [];
  const subcategories =
    categories.find((c) => c.name === (category === NONE ? "" : category))?.subcategories ?? [];

  async function submit() {
    const body: UpdateTicketInput = {};
    const setIfChanged = <K extends keyof UpdateTicketInput>(
      key: K,
      next: string,
      current: string | null,
    ) => {
      const value = next.trim();
      if (value !== (current ?? "")) {
        body[key] = (value || undefined) as UpdateTicketInput[K];
      }
    };

    if (priority !== NONE && priority !== ticket.priority) body.priority = priority as Priority;
    if (category !== NONE && category !== ticket.category) body.category = category;
    if (subcategory !== NONE && subcategory !== ticket.subcategory) body.subcategory = subcategory;
    if (purchaseChannel !== NONE && purchaseChannel !== ticket.commerce.purchaseChannel) {
      body.purchaseChannel = purchaseChannel as PurchaseChannel;
    }
    setIfChanged("orderNumber", orderNumber, ticket.commerce.orderNumber);
    setIfChanged("productSku", productSku, ticket.commerce.productSku);
    setIfChanged("productName", productName, ticket.commerce.productName);
    setIfChanged("batchCode", batchCode, ticket.commerce.batchCode);

    // The API rejects an empty patch outright, so short-circuit rather than round-trip a 400.
    if (Object.keys(body).length === 0) {
      setOpen(false);
      return;
    }

    await update.mutateAsync(body);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1.5">
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit ticket fields</DialogTitle>
          <DialogDescription>
            Status is not editable here — use the transition buttons so the lifecycle rules
            are enforced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unchanged" />
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
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                // A subcategory must belong to its category, so a category change clears it.
                setSubcategory(NONE);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unchanged" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subcategories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unchanged" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-order">Order number</Label>
              <Input
                id="edit-order"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-batch">Batch code</Label>
              <Input
                id="edit-batch"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-product">Product name</Label>
            <Input
              id="edit-product"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-sku">SKU</Label>
            <Input
              id="edit-sku"
              value={productSku}
              onChange={(e) => setProductSku(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Purchase channel</Label>
            <Select value={purchaseChannel} onValueChange={setPurchaseChannel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unchanged" />
              </SelectTrigger>
              <SelectContent>
                {PURCHASE_CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={() => void submit()}>
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
