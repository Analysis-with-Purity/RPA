import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { CATEGORIES } from "./categories";
import { DEPARTMENTS } from "./departments";
import { AGENTS } from "./agents";
import { CURRENT_CUSTOMER } from "./customer";

/** Deterministic PRNG (mulberry32) so filler data is stable across reloads. */
function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function weightedStatus(rand: () => number, daysAgo: number): TicketStatus {
  // Older tickets skew resolved/closed; recent tickets skew open/in-progress.
  if (daysAgo > 30) {
    return pick(rand, [
      "closed",
      "closed",
      "resolved",
      "resolved",
      "resolved",
      "closed",
    ] as const);
  }
  if (daysAgo > 10) {
    return pick(rand, [
      "resolved",
      "resolved",
      "closed",
      "in_progress",
      "awaiting_customer",
    ] as const);
  }
  return pick(rand, [
    "submitted",
    "assigned",
    "in_progress",
    "in_progress",
    "awaiting_customer",
  ] as const);
}

const PRIORITY_WEIGHTS: TicketPriority[] = [
  "low",
  "low",
  "medium",
  "medium",
  "medium",
  "high",
  "high",
  "urgent",
];

const SUBJECT_TEMPLATES: Record<string, string[]> = {
  "cat-technical": [
    "Dashboard fails to load after the latest update",
    "Export to CSV button is unresponsive",
    "Intermittent 500 error on the checkout page",
    "Mobile app crashes on startup",
    "Search results don't update in real time",
    "Reports page keeps timing out",
  ],
  "cat-billing": [
    "Charged twice for last month's invoice",
    "Unable to update payment method",
    "Refund request for a cancelled plan",
    "Invoice is missing the tax breakdown",
    "Annual plan renewed at the wrong price",
  ],
  "cat-account": [
    "Password reset email never arrives",
    "Locked out after enabling two-factor authentication",
    "Need to transfer account ownership",
    "SSO login redirects to a blank page",
    "Unable to change account email address",
  ],
  "cat-feature": [
    "Request: dark mode for the reports view",
    "Please add bulk export for tickets",
    "Would love a Slack integration for notifications",
    "Request for a mobile home-screen widget",
    "Ability to schedule recurring reports",
  ],
  "cat-bug": [
    "Notification badge count is incorrect",
    "Timezone shown is wrong on ticket timestamps",
    "Attachments fail to upload over 10MB",
    "Filters reset unexpectedly when navigating back",
    "Duplicate emails sent for the same reply",
  ],
  "cat-general": [
    "Question about your data retention policy",
    "How do I add a teammate to my workspace?",
    "Looking for API rate-limit documentation",
    "Clarifying the differences between plans",
    "Is there a status page I can subscribe to?",
  ],
};

const TAG_POOL = [
  "billing",
  "urgent",
  "regression",
  "mobile",
  "onboarding",
  "api",
  "follow-up",
  "vip",
  "data-export",
  "integration",
];

function buildDescription(subject: string, categoryName: string) {
  return `Hi team,\n\nI'm running into the following issue: ${subject.toLowerCase()}. It falls under ${categoryName.toLowerCase()}, and it's been affecting my day-to-day workflow.\n\nCould someone take a look when you get a chance? Happy to share more details or a screen recording if useful.\n\nThanks!`;
}

function daysAgoToIso(daysAgo: number, referenceMs: number) {
  return new Date(referenceMs - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

export function generateFillerTickets(
  count: number,
  seed: number,
  referenceMs: number
): Ticket[] {
  const rand = mulberry32(seed);
  const tickets: Ticket[] = [];

  for (let i = 0; i < count; i++) {
    const category = pick(rand, CATEGORIES);
    const department = pick(rand, DEPARTMENTS);
    const subjectPool = SUBJECT_TEMPLATES[category.id] ?? SUBJECT_TEMPLATES["cat-general"];
    const subject = pick(rand, subjectPool);
    const daysAgo = Math.floor(rand() * 60);
    const status = weightedStatus(rand, daysAgo);
    const priority = pick(rand, PRIORITY_WEIGHTS);
    const createdAt = daysAgoToIso(daysAgo, referenceMs);
    const isResolvedLike = status === "resolved" || status === "closed";
    const resolutionDays = Math.min(daysAgo, Math.floor(rand() * 4) + 1);
    const tagCount = Math.floor(rand() * 3);
    const tags = Array.from(
      new Set(Array.from({ length: tagCount }, () => pick(rand, TAG_POOL)))
    );

    tickets.push({
      id: `TCK-${2000 + i}`,
      subject,
      description: buildDescription(subject, category.name),
      status,
      priority,
      categoryId: category.id,
      departmentId: department.id,
      tags,
      requester: CURRENT_CUSTOMER,
      assignedAgentId:
        status === "submitted" ? undefined : pick(rand, AGENTS).id,
      attachmentIds: [],
      messageCount: Math.floor(rand() * 6) + 1,
      createdAt,
      updatedAt: daysAgoToIso(Math.max(0, daysAgo - Math.floor(rand() * 3)), referenceMs),
      resolvedAt: isResolvedLike
        ? daysAgoToIso(Math.max(0, daysAgo - resolutionDays), referenceMs)
        : undefined,
      firstResponseAt:
        status === "submitted" ? undefined : daysAgoToIso(Math.max(0, daysAgo - 1), referenceMs),
      satisfactionRating: isResolvedLike && rand() > 0.3
        ? (Math.min(5, Math.max(1, Math.round(rand() * 2) + 3)) as 1 | 2 | 3 | 4 | 5)
        : undefined,
      slaBreached: priority === "urgent" && rand() > 0.7,
    });
  }

  return tickets;
}
