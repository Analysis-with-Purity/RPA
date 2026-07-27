import type { Ticket } from "@/lib/types";
import { getCategoryById } from "@/lib/mock-data/categories";
import { getDepartmentById } from "@/lib/mock-data/departments";

/**
 * Triggers the UiPath RPA workflow when a ticket is submitted, by adding a work
 * item to an Orchestrator queue (`Q_Intake` by default). A Queue Trigger in
 * Orchestrator then starts the Studio Web process, which classifies the ticket,
 * stores it in Data Fabric marked Unassigned, routes/escalates, etc.
 * (see docs/studio-web-workflow.md).
 *
 * Auth: the same `UIPATH_SECRET` used elsewhere (a Personal Access Token / bearer
 * token) is sent as `Authorization: Bearer …` to the Orchestrator API. The token
 * must have Orchestrator queue permissions (OR.Queues) and access to the folder.
 *
 * Configuration is read from env (see .env.example). If unset, this cleanly
 * no-ops so the app still runs, and it never throws into ticket creation.
 */

interface UiPathConfig {
  baseUrl: string;
  org: string;
  tenant: string;
  secret: string;
  folderId: string;
  queueName: string;
}

function readConfig(): UiPathConfig | null {
  const { UIPATH_BASE_URL, UIPATH_ORG, UIPATH_TENANT, UIPATH_SECRET, UIPATH_FOLDER_ID, UIPATH_QUEUE_NAME } =
    process.env;

  if (!UIPATH_ORG || !UIPATH_TENANT || !UIPATH_SECRET || !UIPATH_FOLDER_ID) return null;

  return {
    baseUrl: (UIPATH_BASE_URL || "https://cloud.uipath.com").replace(/\/$/, ""),
    org: UIPATH_ORG,
    tenant: UIPATH_TENANT,
    secret: UIPATH_SECRET,
    folderId: UIPATH_FOLDER_ID,
    queueName: UIPATH_QUEUE_NAME || "Q_Intake",
  };
}

export function isUiPathConfigured(): boolean {
  return readConfig() !== null;
}

/**
 * The ticket payload the RPA process reads from the queue item's SpecificContent.
 *
 * Key names must match what `SupportTicketIntake` reads, not what reads naturally here:
 * the robot looks for `CustomerName` / `CustomerEmail` / `CreatedDate`. An earlier version
 * of this file sent `RequesterName` / `RequesterEmail` / `CreatedAt`, which the robot
 * silently ignored — tickets were created with blank customer details.
 *
 * `Status` is deliberately not sent. The robot always writes "Not Assigned"; passing a
 * status would imply the caller has a say, which it does not.
 */
function toSpecificContent(ticket: Ticket) {
  return {
    TicketId: ticket.id,
    Channel: "Web",
    Subject: ticket.subject,
    Description: ticket.description,
    Category: getCategoryById(ticket.categoryId)?.name ?? ticket.categoryId,
    Department: getDepartmentById(ticket.departmentId)?.name ?? ticket.departmentId,
    Priority: ticket.priority,
    CustomerName: ticket.requester.name,
    CustomerEmail: ticket.requester.email,
    CreatedDate: ticket.createdAt,
    SourceSystem: "PurityWebApp",
  };
}

export interface TriggerResult {
  triggered: boolean;
  skipped?: boolean;
  queue?: string;
  reference?: string;
  error?: string;
}

export async function triggerTicketWorkflow(ticket: Ticket): Promise<TriggerResult> {
  const cfg = readConfig();
  if (!cfg) {
    return { triggered: false, skipped: true, error: "UiPath not configured (see .env.example)." };
  }

  try {
    const url = `${cfg.baseUrl}/${cfg.org}/${cfg.tenant}/orchestrator_/odata/Queues/UiPathODataSvc.AddQueueItem`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.secret}`,
        "Content-Type": "application/json",
        "X-UIPATH-OrganizationUnitId": cfg.folderId,
      },
      body: JSON.stringify({
        itemData: {
          Name: cfg.queueName,
          Priority: "Normal",
          Reference: ticket.id,
          SpecificContent: toSpecificContent(ticket),
        },
      }),
    });

    if (!res.ok) {
      return {
        triggered: false,
        error: `AddQueueItem failed (${res.status}): ${await res.text()}`,
      };
    }

    return { triggered: true, queue: cfg.queueName, reference: ticket.id };
  } catch (err) {
    return { triggered: false, error: err instanceof Error ? err.message : String(err) };
  }
}
