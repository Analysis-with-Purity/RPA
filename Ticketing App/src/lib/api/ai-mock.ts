import type { Ticket } from "@/lib/types";
import { CATEGORIES } from "@/lib/mock-data/categories";
import { simulateNetwork, apiFetch } from "./client";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "cat-technical": ["error", "crash", "load", "loading", "500", "timeout", "unresponsive", "slow", "bug", "broken"],
  "cat-billing": ["charge", "invoice", "refund", "payment", "billing", "card", "subscription", "price", "renew"],
  "cat-account": ["password", "login", "log in", "access", "locked", "2fa", "sso", "account", "email"],
  "cat-feature": ["request", "feature", "would like", "please add", "wish", "suggestion", "idea"],
  "cat-bug": ["bug", "incorrect", "wrong", "unexpected", "glitch", "doesn't work", "not working"],
  "cat-general": [],
};

export interface CategorySuggestion {
  categoryId: string;
  confidence: number;
}

export async function suggestCategory(text: string): Promise<CategorySuggestion | null> {
  const lower = text.toLowerCase();

  if (lower.trim().length < 12) {
    return simulateNetwork(null, { delayMs: 600 });
  }

  let bestCategoryId: string | null = null;
  let bestScore = 0;

  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategoryId = categoryId;
    }
  }

  if (!bestCategoryId || bestScore === 0) {
    return simulateNetwork(null, { delayMs: 700 });
  }

  const confidence = Math.min(0.95, 0.55 + bestScore * 0.15);

  return simulateNetwork(
    { categoryId: bestCategoryId, confidence },
    { delayMs: 800 }
  );
}

export interface DuplicateTicketMatch {
  ticketId: string;
  subject: string;
  status: string;
  score: number;
}

function tokenize(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
  );
}

export async function findDuplicates(
  subject: string,
  description: string
): Promise<DuplicateTicketMatch[]> {
  const queryTokens = tokenize(`${subject} ${description}`);

  if (queryTokens.size === 0) {
    return simulateNetwork([], { delayMs: 600 });
  }

  const { tickets } = await apiFetch<{ tickets: Ticket[]; total: number }>("/api/v1/tickets");

  const matches = tickets
    .map((ticket) => {
      const ticketTokens = tokenize(ticket.subject);
      let overlap = 0;
      for (const token of ticketTokens) {
        if (queryTokens.has(token)) overlap += 1;
      }
      const score = overlap / Math.max(3, ticketTokens.size);
      return { ticketId: ticket.id, subject: ticket.subject, status: ticket.status, score };
    })
    .filter((m) => m.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Small extra delay so the "AI is thinking" affordance still reads intentionally.
  return simulateNetwork(matches, { delayMs: 500 });
}

const SOLUTION_CONTENT: Record<string, { title: string; body: string }> = {
  "cat-technical": {
    title: "Troubleshooting loading & performance issues",
    body: "Most loading issues clear up after a hard refresh (Ctrl/Cmd+Shift+R) or clearing your browser cache. If it persists, try an incognito window to rule out extensions.",
  },
  "cat-billing": {
    title: "Billing & invoice basics",
    body: "You can view and download all invoices from Settings > Billing > Invoice History. Duplicate charges are usually refunded within 3-5 business days once confirmed.",
  },
  "cat-account": {
    title: "Account access recovery",
    body: "If a password reset email doesn't arrive within a few minutes, check your spam folder and confirm your account email under Settings > Profile. We can also manually trigger a reset.",
  },
  "cat-feature": {
    title: "How we handle feature requests",
    body: "Feature requests are routed to our product team and tracked against demand from other customers. We can't commit to a timeline here, but you'll be notified if it ships.",
  },
  "cat-bug": {
    title: "Reporting bugs effectively",
    body: "Bug reports get resolved fastest with steps to reproduce, your browser/OS version, and a screenshot or recording if possible — feel free to attach one to this ticket.",
  },
  "cat-general": {
    title: "General help resources",
    body: "Our knowledge base covers most common questions. If you don't find what you need there, an agent will follow up here shortly.",
  },
};

export async function getSuggestedSolution(categoryId: string) {
  const content = SOLUTION_CONTENT[categoryId] ?? SOLUTION_CONTENT["cat-general"];
  const category = CATEGORIES.find((c) => c.id === categoryId);

  return simulateNetwork(
    { ...content, categoryName: category?.name ?? "General" },
    { delayMs: 900 }
  );
}
