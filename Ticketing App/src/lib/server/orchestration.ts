import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { getCategoryById } from "@/lib/mock-data/categories";
import { getDepartmentById } from "@/lib/mock-data/departments";

/**
 * Every write leaves this application through an Orchestrator queue.
 *
 * The API's contract is: create, read, search, push queue item, start process. It never
 * writes to Data Fabric — the Maestro process and the RPA workflows own that, which keeps
 * one writer per record and means a Data Fabric outage queues work rather than dropping it.
 *
 * Reads are a separate concern (see `ticket-repository.ts`) and are explicitly permitted:
 * the app must be able to show the result of the automation it kicked off.
 */

/**
 * Queue names.
 *
 * The target design uses Q_TicketIntake, but that queue only becomes useful once a consumer
 * is bound to it. Until the intake workflow is republished against it, `TICKET_INTAKE_QUEUE`
 * points at Q_Intake, which has a working consumer — a spec-correct name with nothing
 * reading it means tickets pile up at status New and customers get silence.
 *
 * Flip the env var (or this default) the moment Workflow 1 is bound to Q_TicketIntake.
 */
export const QUEUES = {
  intake: (process.env.TICKET_INTAKE_QUEUE || "Q_Intake") as
    | "Q_TicketIntake"
    | "Q_Intake",
  assignment: "Q_TicketAssignment",
  resolution: "Q_TicketResolution",
  escalation: "Q_TicketEscalation",
} as const;

export type QueueName = string;

interface OrchestratorConfig {
  baseUrl: string;
  org: string;
  tenant: string;
  secret: string;
  folderId: string;
}

function readConfig(): OrchestratorConfig | null {
  const { UIPATH_BASE_URL, UIPATH_ORG, UIPATH_TENANT, UIPATH_SECRET, UIPATH_FOLDER_ID } =
    process.env;

  if (!UIPATH_ORG || !UIPATH_TENANT || !UIPATH_SECRET || !UIPATH_FOLDER_ID) return null;

  return {
    baseUrl: (UIPATH_BASE_URL || "https://cloud.uipath.com").replace(/\/$/, ""),
    org: UIPATH_ORG,
    tenant: UIPATH_TENANT,
    secret: UIPATH_SECRET,
    folderId: UIPATH_FOLDER_ID,
  };
}

export function isOrchestratorConfigured(): boolean {
  return readConfig() !== null;
}

export interface QueueResult {
  queued: boolean;
  queue?: QueueName;
  reference?: string;
  queueItemId?: number;
  error?: string;
}

type QueuePriority = "Low" | "Normal" | "High";

const PRIORITY_TO_QUEUE: Record<TicketPriority, QueuePriority> = {
  urgent: "High",
  high: "High",
  medium: "Normal",
  low: "Low",
};

/**
 * SpecificContent is a flat string map — Orchestrator does not accept nested objects, and
 * the robots read every value with .ToString().
 */
type SpecificContent = Record<string, string | number | boolean>;

async function addQueueItem(
  queue: QueueName,
  reference: string,
  specificContent: SpecificContent,
  priority: QueuePriority = "Normal",
): Promise<QueueResult> {
  const cfg = readConfig();
  if (!cfg) {
    return { queued: false, error: "UiPath is not configured (see .env.example)." };
  }

  try {
    const res = await fetch(
      `${cfg.baseUrl}/${cfg.org}/${cfg.tenant}/orchestrator_/odata/Queues/UiPathODataSvc.AddQueueItem`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.secret}`,
          "Content-Type": "application/json",
          "X-UIPATH-OrganizationUnitId": cfg.folderId,
        },
        body: JSON.stringify({
          itemData: { Name: queue, Priority: priority, Reference: reference, SpecificContent: specificContent },
        }),
      },
    );

    if (!res.ok) {
      return {
        queued: false,
        queue,
        error: `AddQueueItem to ${queue} failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
      };
    }

    const payload = (await res.json()) as { Id?: number };
    return { queued: true, queue, reference, queueItemId: payload.Id };
  } catch (err) {
    return {
      queued: false,
      queue,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Unique-reference is enforced on all four queues, so a command reference must be unique
 * per command rather than per ticket — the same ticket is legitimately assigned, resolved
 * and escalated over its life.
 */
function commandReference(ticketId: string, verb: string): string {
  return `${ticketId}:${verb}:${Date.now().toString(36).toUpperCase()}`;
}

// --------------------------------------------------------------------------- intake

/**
 * Ticket creation. The robot reads these exact keys — `CustomerName` / `CustomerEmail` /
 * `CreatedDate`, not the requester-shaped names the UI uses internally.
 *
 * `Status` is deliberately absent: the intake workflow always writes "Not Assigned", and
 * accepting a status here would imply the caller has a say.
 */
export function queueTicketIntake(ticket: Ticket): Promise<QueueResult> {
  return addQueueItem(
    QUEUES.intake,
    ticket.id,
    {
      TicketId: ticket.id,
      Subject: ticket.subject,
      Description: ticket.description,
      Category: getCategoryById(ticket.categoryId)?.name ?? ticket.categoryId,
      Department: getDepartmentById(ticket.departmentId)?.name ?? ticket.departmentId,
      Priority: ticket.priority,
      Channel: "Web",
      CustomerName: ticket.requester.name,
      CustomerEmail: ticket.requester.email,
      CreatedDate: ticket.createdAt,
      SourceSystem: "PurityCodedApp",
    },
    PRIORITY_TO_QUEUE[ticket.priority],
  );
}

// ------------------------------------------------------------------ start / triage

/**
 * The START PROCESS / TRIAGE TICKET action. Hands the ticket to the Maestro BPMN process,
 * which validates, triages, branches on priority and drives the assignment workflow.
 */
export function queueTriage(
  ticketId: string,
  opts: { priority?: TicketPriority; requestedBy: string } = { requestedBy: "CodedApp" },
): Promise<QueueResult> {
  return addQueueItem(
    QUEUES.intake,
    commandReference(ticketId, "TRIAGE"),
    {
      TicketId: ticketId,
      Command: "Triage",
      RequestedBy: opts.requestedBy,
      RequestedAt: new Date().toISOString(),
      SourceSystem: "PurityCodedApp",
    },
    opts.priority ? PRIORITY_TO_QUEUE[opts.priority] : "High",
  );
}

// -------------------------------------------------------------------- state changes

/** Routes a requested status change to the queue that owns that part of the lifecycle. */
export function queueForStatus(status: TicketStatus): QueueName {
  if (status === "resolved" || status === "closed") return QUEUES.resolution;
  if (status === "assigned") return QUEUES.assignment;
  return QUEUES.resolution;
}

export function queueStatusChange(
  ticketId: string,
  status: TicketStatus,
  requestedBy: string,
): Promise<QueueResult> {
  return addQueueItem(queueForStatus(status), commandReference(ticketId, "STATUS"), {
    TicketId: ticketId,
    Command: "UpdateStatus",
    TargetStatus: status,
    RequestedBy: requestedBy,
    RequestedAt: new Date().toISOString(),
    SourceSystem: "PurityCodedApp",
  });
}

export function queueAssignment(
  ticketId: string,
  assignee: string | undefined,
  requestedBy: string,
): Promise<QueueResult> {
  return addQueueItem(QUEUES.assignment, commandReference(ticketId, "ASSIGN"), {
    TicketId: ticketId,
    // No assignee means "let Auto Assignment decide from priority, category and workload".
    Command: assignee ? "AssignTo" : "AutoAssign",
    ...(assignee ? { Assignee: assignee } : {}),
    RequestedBy: requestedBy,
    RequestedAt: new Date().toISOString(),
    SourceSystem: "PurityCodedApp",
  });
}

export function queueEscalation(
  ticketId: string,
  reason: string,
  requestedBy: string,
): Promise<QueueResult> {
  return addQueueItem(
    QUEUES.escalation,
    commandReference(ticketId, "ESCALATE"),
    {
      TicketId: ticketId,
      Command: "Escalate",
      Reason: reason,
      RequestedBy: requestedBy,
      RequestedAt: new Date().toISOString(),
      SourceSystem: "PurityCodedApp",
    },
    "High",
  );
}
