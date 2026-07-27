/**
 * Reference data for the support desk.
 *
 * Kept in code rather than in Data Fabric because it is configuration, not transactional
 * data: it changes with the business, is read on nearly every request, and must stay in
 * lockstep with the validation rules below. `GET /api/config` serves this to the website
 * so form dropdowns can never drift from what the API accepts.
 */

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CHANNELS = ['Web', 'Email', 'Phone', 'Chat', 'Social', 'Boutique'] as const;
export type Channel = (typeof CHANNELS)[number];

export const PURCHASE_CHANNELS = [
  'Website',
  'Amazon',
  'Boutique',
  'DepartmentStore',
  'Wholesale',
  'Gift',
  'Other',
] as const;
export type PurchaseChannel = (typeof PURCHASE_CHANNELS)[number];

export const REFUND_STATUSES = ['None', 'Requested', 'Approved', 'Processed', 'Rejected'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

// --------------------------------------------------------------------- statuses

export const STATUSES = [
  'Not Assigned',
  'Assigned',
  'In Progress',
  'Waiting on Customer',
  'Resolved',
  'Closed',
  'Cancelled',
] as const;
export type TicketStatus = (typeof STATUSES)[number];

/** The value the intake automation always writes. Nothing else may create a ticket. */
export const INITIAL_STATUS: TicketStatus = 'Not Assigned';

/** Statuses an agent considers "open work". */
export const OPEN_STATUSES: TicketStatus[] = [
  'Not Assigned',
  'Assigned',
  'In Progress',
  'Waiting on Customer',
];

/**
 * Allowed status transitions. Enforced by the API so the ticket lifecycle cannot be
 * corrupted by a client sending an arbitrary status.
 */
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  'Not Assigned': ['Assigned', 'In Progress', 'Cancelled'],
  Assigned: ['In Progress', 'Waiting on Customer', 'Resolved', 'Not Assigned', 'Cancelled'],
  'In Progress': ['Waiting on Customer', 'Resolved', 'Assigned', 'Cancelled'],
  'Waiting on Customer': ['In Progress', 'Resolved', 'Cancelled'],
  Resolved: ['Closed', 'In Progress'], // In Progress = reopened
  Closed: ['In Progress'], // reopen a closed ticket
  Cancelled: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

// -------------------------------------------------------------------- categories

export interface CategoryDef {
  name: string;
  subcategories: string[];
  /** Priority floor. A submission below this is raised to it. */
  minimumPriority?: Priority;
  /** Marks categories needing regulatory traceability (batch code, adverse events). */
  requiresBatchCode?: boolean;
  /** Product identification is meaningful for this category. */
  productRelevant?: boolean;
  /** Ticket normally concerns a specific order. */
  orderRelevant?: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: 'Order & Delivery',
    orderRelevant: true,
    subcategories: [
      'Order not received',
      'Late delivery',
      'Wrong item received',
      'Missing item from order',
      'Damaged in transit',
      'Leaking bottle',
      'Tracking issue',
      'Customs or duties',
    ],
  },
  {
    name: 'Product Quality',
    productRelevant: true,
    orderRelevant: true,
    requiresBatchCode: true,
    subcategories: [
      'Fragrance smells different',
      'Atomiser or pump fault',
      'Packaging damaged',
      'Longevity below expectation',
      'Colour or consistency concern',
      'Volume below stated',
    ],
  },
  {
    name: 'Authenticity',
    productRelevant: true,
    requiresBatchCode: true,
    minimumPriority: 'High',
    subcategories: [
      'Suspected counterfeit',
      'Batch code verification',
      'Purchased from unauthorised seller',
      'Packaging inconsistency',
    ],
  },
  {
    name: 'Health & Safety',
    productRelevant: true,
    requiresBatchCode: true,
    minimumPriority: 'Urgent',
    subcategories: [
      'Skin irritation',
      'Allergic reaction',
      'Eye contact',
      'Accidental ingestion',
      'Breathing difficulty',
    ],
  },
  {
    name: 'Returns & Refunds',
    orderRelevant: true,
    subcategories: [
      'Return request',
      'Refund status',
      'Exchange request',
      'Return label issue',
      'Restocking fee query',
      'Faulty goods refund',
    ],
  },
  {
    name: 'Fragrance Advice',
    productRelevant: true,
    subcategories: [
      'Scent recommendation',
      'Layering advice',
      'Gift recommendation',
      'Sample request',
      'Notes or ingredient enquiry',
      'Allergen information',
    ],
  },
  {
    name: 'Account & Orders',
    subcategories: [
      'Cannot sign in',
      'Change delivery address',
      'Cancel order',
      'Update payment method',
      'Loyalty points',
      'Marketing preferences',
    ],
  },
  {
    name: 'Subscription',
    subcategories: [
      'Pause subscription',
      'Cancel subscription',
      'Change frequency',
      'Change scent selection',
      'Billing query',
    ],
  },
  {
    name: 'Wholesale & B2B',
    subcategories: [
      'Stockist enquiry',
      'Bulk order',
      'Trade pricing',
      'Marketing assets',
      'Lead time enquiry',
    ],
  },
  {
    name: 'Personalisation & Gifting',
    orderRelevant: true,
    subcategories: [
      'Engraving request',
      'Gift wrapping',
      'Gift message',
      'Corporate gifting',
      'Gift receipt',
    ],
  },
  {
    name: 'Feedback & Other',
    subcategories: ['Compliment', 'Complaint', 'Press or collaboration', 'Suggestion', 'Other'],
  },
];

const categoryIndex = new Map(CATEGORIES.map((c) => [c.name.toLowerCase(), c]));

export function findCategory(name: string | undefined): CategoryDef | undefined {
  if (!name) return undefined;
  return categoryIndex.get(name.trim().toLowerCase());
}

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

// -------------------------------------------------------------------- SLA policy

export interface SlaPolicy {
  name: string;
  priority: Priority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

/**
 * Business-hours are deliberately ignored: fragrance support runs against courier and
 * adverse-event timelines, not office hours. Switch to a calendar-aware calculation here
 * if the brand adopts one.
 */
export const SLA_POLICIES: Record<Priority, SlaPolicy> = {
  Urgent: {
    name: 'Urgent - safety and authenticity',
    priority: 'Urgent',
    firstResponseMinutes: 60,
    resolutionMinutes: 4 * 60,
  },
  High: {
    name: 'High - order and quality',
    priority: 'High',
    firstResponseMinutes: 4 * 60,
    resolutionMinutes: 24 * 60,
  },
  Medium: {
    name: 'Medium - standard',
    priority: 'Medium',
    firstResponseMinutes: 8 * 60,
    resolutionMinutes: 72 * 60,
  },
  Low: {
    name: 'Low - advisory',
    priority: 'Low',
    firstResponseMinutes: 24 * 60,
    resolutionMinutes: 120 * 60,
  },
};

const PRIORITY_RANK: Record<Priority, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };

/**
 * Raises the submitted priority to the category floor. A customer reporting an allergic
 * reaction as "Low" must still be treated as Urgent.
 */
export function effectivePriority(
  submitted: Priority | undefined,
  categoryName: string | undefined,
): { priority: Priority; raised: boolean; reason?: string } {
  const base: Priority = submitted ?? 'Medium';
  const category = findCategory(categoryName);
  const floor = category?.minimumPriority;
  if (floor && PRIORITY_RANK[floor] > PRIORITY_RANK[base]) {
    return {
      priority: floor,
      raised: true,
      reason: `Category "${category?.name}" enforces a minimum priority of ${floor}.`,
    };
  }
  return { priority: base, raised: false };
}

/** Routing team per category. Written to AssignmentGroup for downstream routing. */
export const ASSIGNMENT_GROUPS: Record<string, string> = {
  'Order & Delivery': 'Logistics',
  'Product Quality': 'Quality Assurance',
  Authenticity: 'Brand Protection',
  'Health & Safety': 'Product Safety',
  'Returns & Refunds': 'Returns',
  'Fragrance Advice': 'Fragrance Advisors',
  'Account & Orders': 'Customer Care',
  Subscription: 'Subscriptions',
  'Wholesale & B2B': 'Wholesale',
  'Personalisation & Gifting': 'Personalisation',
  'Feedback & Other': 'Customer Care',
};

export function assignmentGroupFor(categoryName: string | undefined): string {
  const category = findCategory(categoryName);
  return (category && ASSIGNMENT_GROUPS[category.name]) || 'Customer Care';
}
