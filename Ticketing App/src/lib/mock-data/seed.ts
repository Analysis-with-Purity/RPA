import type { Ticket, Message, ActivityEvent } from "@/lib/types";
import { CURRENT_CUSTOMER } from "./customer";
import { generateFillerTickets } from "./generate";

const REFERENCE_MS = Date.now();

function daysAgo(n: number, hoursAgo = 0) {
  return new Date(REFERENCE_MS - n * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000).toISOString();
}

const agentAuthor = (id: string, name: string) => ({ id, name, role: "agent" as const });
const customerAuthor = { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" as const };
const systemAuthor = { id: "system", name: "Purity Support", role: "system" as const };

let messageSeq = 0;
function msg(
  ticketId: string,
  author: { id: string; name: string; role: "customer" | "agent" | "system" },
  body: string,
  daysAgoValue: number,
  hoursAgoValue = 0
): Message {
  messageSeq += 1;
  return {
    id: `MSG-${messageSeq}`,
    ticketId,
    author,
    body,
    attachmentIds: [],
    createdAt: daysAgo(daysAgoValue, hoursAgoValue),
  };
}

let activitySeq = 0;
function activity(
  ticketId: string,
  type: ActivityEvent["type"],
  actor: ActivityEvent["actor"],
  daysAgoValue: number,
  extra?: Partial<Pick<ActivityEvent, "fromValue" | "toValue">>
): ActivityEvent {
  activitySeq += 1;
  return {
    id: `ACT-${activitySeq}`,
    ticketId,
    type,
    actor,
    createdAt: daysAgo(daysAgoValue),
    ...extra,
  };
}

interface ShowcaseEntry {
  ticket: Ticket;
  messages: Message[];
  activity: ActivityEvent[];
}

const priya = agentAuthor("agent-priya", "Priya Nair");
const daniel = agentAuthor("agent-daniel", "Daniel Cho");
const lena = agentAuthor("agent-lena", "Lena Vasquez");
const tobi = agentAuthor("agent-tobi", "Tobi Adewale");
const mira = agentAuthor("agent-mira", "Mira Osei");

const SHOWCASE: ShowcaseEntry[] = [
  {
    ticket: {
      id: "TCK-1001",
      subject: "Dashboard fails to load after the latest update",
      description:
        "Since this morning's release, the main dashboard just spins on a loading skeleton and never renders. Happens in both Chrome and Safari, on two different accounts.",
      status: "in_progress",
      priority: "urgent",
      categoryId: "cat-technical",
      departmentId: "dept-engineering",
      tags: ["regression", "urgent"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-priya",
      attachmentIds: [],
      messageCount: 4,
      createdAt: daysAgo(1, 4),
      updatedAt: daysAgo(0, 2),
      firstResponseAt: daysAgo(1, 1),
      slaBreached: true,
    },
    messages: [
      msg("TCK-1001", customerAuthor, "Since this morning's release, the main dashboard just spins on a loading skeleton and never renders. Happens in both Chrome and Safari, on two different accounts.", 1, 4),
      msg("TCK-1001", priya, "Thanks for flagging this immediately — I can reproduce it on our end too. It looks tied to this morning's deploy. Escalating to engineering now.", 1, 1),
      msg("TCK-1001", systemAuthor, "Priority escalated to Urgent.", 1, 0),
      msg("TCK-1001", priya, "We've identified a bad cache key introduced in the deploy. A fix is being tested now — I'll update you the moment it's live.", 0, 2),
    ],
    activity: [
      activity("TCK-1001", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 1),
      activity("TCK-1001", "assigned", { id: "system", name: "Purity Support", role: "system" }, 1, { toValue: "Priya Nair" }),
      activity("TCK-1001", "priority_changed", priya, 1, { fromValue: "high", toValue: "urgent" }),
      activity("TCK-1001", "status_changed", priya, 0, { fromValue: "assigned", toValue: "in_progress" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1002",
      subject: "Charged twice for August invoice",
      description:
        "My card was charged twice for the August subscription — once on the 1st and again on the 3rd. Could you refund the duplicate charge?",
      status: "awaiting_customer",
      priority: "high",
      categoryId: "cat-billing",
      departmentId: "dept-billing",
      tags: ["billing"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-lena",
      attachmentIds: ["ATT-1"],
      messageCount: 3,
      createdAt: daysAgo(3, 6),
      updatedAt: daysAgo(2, 1),
      firstResponseAt: daysAgo(3, 2),
    },
    messages: [
      msg("TCK-1002", customerAuthor, "My card was charged twice for the August subscription — once on the 1st and again on the 3rd. Could you refund the duplicate charge? Screenshot of both charges attached.", 3, 6),
      msg("TCK-1002", lena, "Thanks for the screenshot — I can see both charges on our side as well. Before I process the refund, can you confirm the last 4 digits of the card that was charged?", 3, 2),
      msg("TCK-1002", systemAuthor, "Waiting on your reply to continue.", 2, 1),
    ],
    activity: [
      activity("TCK-1002", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 3),
      activity("TCK-1002", "assigned", { id: "system", name: "Purity Support", role: "system" }, 3, { toValue: "Lena Vasquez" }),
      activity("TCK-1002", "status_changed", lena, 2, { fromValue: "in_progress", toValue: "awaiting_customer" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1003",
      subject: "Password reset email never arrives",
      description:
        "I've requested a password reset four times over the last hour and never receive the email, even after checking spam.",
      status: "resolved",
      priority: "medium",
      categoryId: "cat-account",
      departmentId: "dept-support",
      tags: ["onboarding"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-daniel",
      attachmentIds: [],
      messageCount: 4,
      createdAt: daysAgo(14, 3),
      updatedAt: daysAgo(13, 5),
      resolvedAt: daysAgo(13, 5),
      firstResponseAt: daysAgo(14, 1),
      satisfactionRating: 2,
    },
    messages: [
      msg("TCK-1003", customerAuthor, "I've requested a password reset four times over the last hour and never receive the email, even after checking spam.", 14, 3),
      msg("TCK-1003", daniel, "Sorry for the trouble — I can see the emails were being caught by an internal filter. I've manually reset your password and sent a temporary one to your inbox.", 14, 1),
      msg("TCK-1003", customerAuthor, "Got it, thanks — took a while to get here though.", 13, 6),
      msg("TCK-1003", daniel, "Understood, and I agree that shouldn't have taken this long. We're fixing the filter so this doesn't happen again. Marking this resolved, but reach back out if anything's still off.", 13, 5),
    ],
    activity: [
      activity("TCK-1003", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 14),
      activity("TCK-1003", "assigned", { id: "system", name: "Purity Support", role: "system" }, 14, { toValue: "Daniel Cho" }),
      activity("TCK-1003", "status_changed", daniel, 13, { fromValue: "in_progress", toValue: "resolved" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1004",
      subject: "Request: dark mode for the reports view",
      description:
        "The rest of the app supports dark mode beautifully, but the Reports section still renders with a bright white background. Any chance this gets added?",
      status: "submitted",
      priority: "low",
      categoryId: "cat-feature",
      departmentId: "dept-support",
      tags: [],
      requester: CURRENT_CUSTOMER,
      attachmentIds: [],
      messageCount: 1,
      createdAt: daysAgo(0, 3),
      updatedAt: daysAgo(0, 3),
    },
    messages: [
      msg("TCK-1004", customerAuthor, "The rest of the app supports dark mode beautifully, but the Reports section still renders with a bright white background. Any chance this gets added?", 0, 3),
    ],
    activity: [
      activity("TCK-1004", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 0),
    ],
  },
  {
    ticket: {
      id: "TCK-1005",
      subject: "Notification badge count is incorrect",
      description:
        "The unread notification badge always shows 3 more than the actual number of unread items in the list.",
      status: "assigned",
      priority: "medium",
      categoryId: "cat-bug",
      departmentId: "dept-engineering",
      tags: ["regression"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-tobi",
      attachmentIds: [],
      messageCount: 2,
      createdAt: daysAgo(2, 5),
      updatedAt: daysAgo(1, 8),
      firstResponseAt: daysAgo(1, 8),
    },
    messages: [
      msg("TCK-1005", customerAuthor, "The unread notification badge always shows 3 more than the actual number of unread items in the list.", 2, 5),
      msg("TCK-1005", tobi, "Thanks for the report — I can reproduce this when notifications are dismissed in bulk. Looking into the counter logic now.", 1, 8),
    ],
    activity: [
      activity("TCK-1005", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 2),
      activity("TCK-1005", "assigned", { id: "system", name: "Purity Support", role: "system" }, 1, { toValue: "Tobi Adewale" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1006",
      subject: "Refund request for a cancelled plan",
      description:
        "I cancelled my Professional plan two weeks before renewal but was still billed for the full month. Requesting a prorated refund.",
      status: "resolved",
      priority: "high",
      categoryId: "cat-billing",
      departmentId: "dept-billing",
      tags: ["billing", "vip"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-lena",
      attachmentIds: [],
      messageCount: 3,
      createdAt: daysAgo(20, 2),
      updatedAt: daysAgo(18, 4),
      resolvedAt: daysAgo(18, 4),
      firstResponseAt: daysAgo(19, 6),
      satisfactionRating: 5,
    },
    messages: [
      msg("TCK-1006", customerAuthor, "I cancelled my Professional plan two weeks before renewal but was still billed for the full month. Requesting a prorated refund.", 20, 2),
      msg("TCK-1006", lena, "You're right, this should have been prorated automatically. I've issued a refund for the unused 12 days — you should see it in 3-5 business days.", 19, 6),
      msg("TCK-1006", customerAuthor, "That was fast, thank you!", 18, 4),
    ],
    activity: [
      activity("TCK-1006", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 20),
      activity("TCK-1006", "assigned", { id: "system", name: "Purity Support", role: "system" }, 20, { toValue: "Lena Vasquez" }),
      activity("TCK-1006", "status_changed", lena, 18, { fromValue: "in_progress", toValue: "resolved" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1007",
      subject: "Mobile app crashes on startup",
      description:
        "The iOS app crashes immediately on launch after updating to the latest version. Reinstalling didn't help.",
      status: "in_progress",
      priority: "urgent",
      categoryId: "cat-bug",
      departmentId: "dept-engineering",
      tags: ["mobile", "regression", "urgent"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-priya",
      attachmentIds: [],
      messageCount: 3,
      createdAt: daysAgo(1, 10),
      updatedAt: daysAgo(0, 6),
      firstResponseAt: daysAgo(1, 3),
      slaBreached: true,
    },
    messages: [
      msg("TCK-1007", customerAuthor, "The iOS app crashes immediately on launch after updating to the latest version. Reinstalling didn't help.", 1, 10),
      msg("TCK-1007", priya, "Confirmed — this affects devices on iOS 17.1 and below. A hotfix is already in App Store review.", 1, 3),
      msg("TCK-1007", priya, "The hotfix has been approved and is rolling out now. Please update and let me know if the crash persists.", 0, 6),
    ],
    activity: [
      activity("TCK-1007", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 1),
      activity("TCK-1007", "assigned", { id: "system", name: "Purity Support", role: "system" }, 1, { toValue: "Priya Nair" }),
      activity("TCK-1007", "status_changed", priya, 1, { fromValue: "assigned", toValue: "in_progress" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1008",
      subject: "Question about your data retention policy",
      description:
        "How long do you retain closed ticket data, and is there a way to export it before deletion?",
      status: "closed",
      priority: "low",
      categoryId: "cat-general",
      departmentId: "dept-support",
      tags: [],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-mira",
      attachmentIds: [],
      messageCount: 2,
      createdAt: daysAgo(35, 2),
      updatedAt: daysAgo(34, 5),
      resolvedAt: daysAgo(34, 5),
      firstResponseAt: daysAgo(34, 6),
      satisfactionRating: 4,
    },
    messages: [
      msg("TCK-1008", customerAuthor, "How long do you retain closed ticket data, and is there a way to export it before deletion?", 35, 2),
      msg("TCK-1008", mira, "We retain ticket data for 24 months after closure, and yes — you can export your full history anytime from Settings > Data Export. Let me know if you'd like a hand with that.", 34, 6),
    ],
    activity: [
      activity("TCK-1008", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 35),
      activity("TCK-1008", "assigned", { id: "system", name: "Purity Support", role: "system" }, 35, { toValue: "Mira Osei" }),
      activity("TCK-1008", "status_changed", mira, 34, { fromValue: "resolved", toValue: "closed" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1009",
      subject: "SSO login redirects to a blank page",
      description:
        "After entering credentials on our identity provider, we're redirected back to the app but land on a completely blank page.",
      status: "awaiting_customer",
      priority: "urgent",
      categoryId: "cat-account",
      departmentId: "dept-engineering",
      tags: ["api", "vip"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-daniel",
      attachmentIds: [],
      messageCount: 3,
      createdAt: daysAgo(4, 7),
      updatedAt: daysAgo(3, 2),
      firstResponseAt: daysAgo(4, 2),
    },
    messages: [
      msg("TCK-1009", customerAuthor, "After entering credentials on our identity provider, we're redirected back to the app but land on a completely blank page.", 4, 7),
      msg("TCK-1009", daniel, "Thanks — could you share which identity provider you're using (Okta, Azure AD, etc.) and the exact redirect URL configured?", 4, 2),
      msg("TCK-1009", systemAuthor, "Waiting on your reply to continue.", 3, 2),
    ],
    activity: [
      activity("TCK-1009", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 4),
      activity("TCK-1009", "assigned", { id: "system", name: "Purity Support", role: "system" }, 4, { toValue: "Daniel Cho" }),
      activity("TCK-1009", "status_changed", daniel, 3, { fromValue: "in_progress", toValue: "awaiting_customer" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1010",
      subject: "Looking for API rate-limit documentation",
      description:
        "Can't find documented rate limits for the v2 API anywhere. What are the current per-key limits?",
      status: "resolved",
      priority: "low",
      categoryId: "cat-general",
      departmentId: "dept-support",
      tags: ["api"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-mira",
      attachmentIds: [],
      messageCount: 2,
      createdAt: daysAgo(8, 3),
      updatedAt: daysAgo(8, 1),
      resolvedAt: daysAgo(8, 1),
      firstResponseAt: daysAgo(8, 1),
      satisfactionRating: 5,
    },
    messages: [
      msg("TCK-1010", customerAuthor, "Can't find documented rate limits for the v2 API anywhere. What are the current per-key limits?", 8, 3),
      msg("TCK-1010", mira, "Good catch — that page was missing from the public docs. Current limits are 600 requests/minute per key, burst up to 1000. I've also filed a ticket internally to get the docs page published.", 8, 1),
    ],
    activity: [
      activity("TCK-1010", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 8),
      activity("TCK-1010", "assigned", { id: "system", name: "Purity Support", role: "system" }, 8, { toValue: "Mira Osei" }),
      activity("TCK-1010", "status_changed", mira, 8, { fromValue: "in_progress", toValue: "resolved" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1011",
      subject: "Export to CSV button is unresponsive",
      description:
        "Clicking 'Export to CSV' on the ticket list does nothing — no download, no error, no loading state.",
      status: "in_progress",
      priority: "medium",
      categoryId: "cat-technical",
      departmentId: "dept-engineering",
      tags: ["data-export"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-tobi",
      attachmentIds: [],
      messageCount: 2,
      createdAt: daysAgo(2, 9),
      updatedAt: daysAgo(1, 4),
      firstResponseAt: daysAgo(2, 4),
    },
    messages: [
      msg("TCK-1011", customerAuthor, "Clicking 'Export to CSV' on the ticket list does nothing — no download, no error, no loading state.", 2, 9),
      msg("TCK-1011", tobi, "Reproduced this when more than 500 tickets match the current filter — the export silently times out. Working on a streaming export to fix it.", 1, 4),
    ],
    activity: [
      activity("TCK-1011", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 2),
      activity("TCK-1011", "assigned", { id: "system", name: "Purity Support", role: "system" }, 2, { toValue: "Tobi Adewale" }),
      activity("TCK-1011", "status_changed", tobi, 1, { fromValue: "assigned", toValue: "in_progress" }),
    ],
  },
  {
    ticket: {
      id: "TCK-1012",
      subject: "Annual plan renewed at the wrong price",
      description:
        "My annual plan renewed at the current list price instead of the discounted rate I locked in last year.",
      status: "resolved",
      priority: "high",
      categoryId: "cat-billing",
      departmentId: "dept-billing",
      tags: ["billing"],
      requester: CURRENT_CUSTOMER,
      assignedAgentId: "agent-lena",
      attachmentIds: [],
      messageCount: 4,
      createdAt: daysAgo(25, 4),
      updatedAt: daysAgo(22, 2),
      resolvedAt: daysAgo(22, 2),
      firstResponseAt: daysAgo(24, 6),
      satisfactionRating: 2,
    },
    messages: [
      msg("TCK-1012", customerAuthor, "My annual plan renewed at the current list price instead of the discounted rate I locked in last year.", 25, 4),
      msg("TCK-1012", lena, "Let me look into your account's pricing history — can you confirm the discount code or offer you originally signed up under?", 24, 6),
      msg("TCK-1012", customerAuthor, "It was the LAUNCH20 code from the original signup email.", 23, 5),
      msg("TCK-1012", lena, "Found it — that discount was meant to carry over and didn't due to a migration issue on our end. I've applied a credit for the difference and locked in the discounted rate going forward.", 22, 2),
    ],
    activity: [
      activity("TCK-1012", "created", { id: CURRENT_CUSTOMER.id, name: CURRENT_CUSTOMER.name, role: "customer" }, 25),
      activity("TCK-1012", "assigned", { id: "system", name: "Purity Support", role: "system" }, 25, { toValue: "Lena Vasquez" }),
      activity("TCK-1012", "status_changed", lena, 22, { fromValue: "in_progress", toValue: "resolved" }),
    ],
  },
];

const FILLER_TICKETS = generateFillerTickets(38, 0x9e3779b9, REFERENCE_MS);

export const tickets: Ticket[] = [
  ...SHOWCASE.map((entry) => entry.ticket),
  ...FILLER_TICKETS,
];

export const messages: Message[] = SHOWCASE.flatMap((entry) => entry.messages);

export const activityEvents: ActivityEvent[] = SHOWCASE.flatMap((entry) => entry.activity);

export function nextMessageId() {
  messageSeq += 1;
  return `MSG-${messageSeq}`;
}

export function nextActivityId() {
  activitySeq += 1;
  return `ACT-${activitySeq}`;
}

export function nextTicketNumber() {
  return tickets.length + 1;
}
