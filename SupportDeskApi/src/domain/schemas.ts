import { z } from 'zod';
import {
  CATEGORY_NAMES,
  CHANNELS,
  PRIORITIES,
  PURCHASE_CHANNELS,
  REFUND_STATUSES,
  STATUSES,
  findCategory,
} from '../config/catalog.js';

/**
 * Field length caps mirror the Data Fabric column limits exactly. Rejecting here with a
 * clear 400 is far better than letting Data Fabric raise a constraint violation that the
 * automation would classify as a system exception and retry.
 */

/** Treats "", "   ", "n/a" and "-" as absent. Stops placeholder text failing email validation. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `must be at most ${max} characters`)
    .transform((v) => (v === '' || /^(n\/?a|-|none|null)$/i.test(v) ? undefined : v))
    .optional();

const requiredText = (max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must not be empty`)
    .max(max, `${label} must be at most ${max} characters`);

/** Matches the automation's regex so the two never disagree about a valid address. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

const emailOptional = optionalText(320).refine(
  (v) => v === undefined || EMAIL_RE.test(v),
  'must be a valid email address, or omitted entirely',
);

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'must be a parseable date'));

// ------------------------------------------------------------------ ticket intake

export const CreateTicketSchema = z
  .object({
    subject: requiredText(500, 'Subject'),
    description: requiredText(10_000, 'Description'),

    priority: z.enum(PRIORITIES).optional(),
    category: z.enum(CATEGORY_NAMES as [string, ...string[]]).optional(),
    subcategory: optionalText(100),
    channel: z.enum(CHANNELS).default('Web'),

    customerName: optionalText(200),
    customerEmail: emailOptional,
    customerPhone: optionalText(50),
    organization: optionalText(200),
    department: optionalText(200),

    orderNumber: optionalText(100),
    productSku: optionalText(100),
    productName: optionalText(300),
    batchCode: optionalText(100),
    purchaseChannel: z.enum(PURCHASE_CHANNELS).optional(),

    attachmentReferences: z.array(z.string().url()).max(20).optional(),

    /** Client-supplied creation time. Defaults to now when absent. */
    createdDate: isoDate.optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    // Subcategory must belong to the chosen category.
    if (val.subcategory) {
      const cat = findCategory(val.category);
      if (!cat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['subcategory'],
          message: 'subcategory requires a valid category',
        });
      } else if (!cat.subcategories.includes(val.subcategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['subcategory'],
          message: `"${val.subcategory}" is not a subcategory of "${cat.name}". Valid: ${cat.subcategories.join(', ')}`,
        });
      }
    }

    // A safety or authenticity report without a batch code cannot be investigated or recalled
    // against, so refuse it at the boundary rather than accepting an untraceable report.
    const cat = findCategory(val.category);
    if (cat?.requiresBatchCode && cat.minimumPriority === 'Urgent' && !val.batchCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['batchCode'],
        message:
          'batchCode is required for Health & Safety reports so the affected batch can be traced. It is printed on the base of the bottle and on the carton.',
      });
    }

    // Contactability: we must be able to reach the customer somehow.
    if (!val.customerEmail && !val.customerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customerEmail'],
        message: 'provide customerEmail or customerPhone so the customer can be contacted',
      });
    }
  });

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

// ------------------------------------------------------------------- agent search

export const TicketSearchSchema = z
  .object({
    status: z
      .union([z.enum(STATUSES), z.array(z.enum(STATUSES))])
      .optional()
      .transform((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v])),
    priority: z.enum(PRIORITIES).optional(),
    category: z.string().trim().max(100).optional(),
    subcategory: z.string().trim().max(100).optional(),
    assignedAgentEmail: z.string().trim().max(320).optional(),
    assignmentGroup: z.string().trim().max(200).optional(),
    customerEmail: z.string().trim().max(320).optional(),
    organization: z.string().trim().max(200).optional(),
    orderNumber: z.string().trim().max(100).optional(),
    batchCode: z.string().trim().max(100).optional(),
    productSku: z.string().trim().max(100).optional(),
    refundStatus: z.enum(REFUND_STATUSES).optional(),

    /** `open` collapses the four active statuses; overrides `status` when true. */
    openOnly: z.coerce.boolean().optional(),
    /** Only tickets past their resolution deadline and not yet resolved. */
    breachedOnly: z.coerce.boolean().optional(),

    createdFrom: isoDate.optional(),
    createdTo: isoDate.optional(),

    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sortBy: z
      .enum(['CreatedDate', 'IngestedAt', 'Priority', 'Status', 'ResolutionDueDate'])
      .default('CreatedDate'),
    sortDesc: z.coerce.boolean().default(true),
  })
  .strict();

export type TicketSearchInput = z.infer<typeof TicketSearchSchema>;

// ------------------------------------------------------------------- agent actions

export const AssignSchema = z
  .object({
    agentName: requiredText(200, 'agentName'),
    agentEmail: z
      .string()
      .trim()
      .max(320)
      .refine((v) => EMAIL_RE.test(v), 'must be a valid email address'),
    assignmentGroup: optionalText(200),
    note: optionalText(10_000),
  })
  .strict();

export const StatusChangeSchema = z
  .object({
    status: z.enum(STATUSES),
    note: optionalText(10_000),
  })
  .strict();

export const ResolveSchema = z
  .object({
    resolutionNotes: requiredText(4000, 'resolutionNotes'),
    /** Posted to the customer as a visible reply when supplied. */
    customerReply: optionalText(10_000),
  })
  .strict();

export const CloseSchema = z
  .object({
    note: optionalText(10_000),
    csatScore: z.coerce.number().int().min(1).max(5).optional(),
  })
  .strict();

export const EscalateSchema = z
  .object({
    reason: requiredText(4000, 'reason'),
    /** Absolute level to set. Omit to increment by one. */
    level: z.coerce.number().int().min(1).max(10).optional(),
    raisePriorityTo: z.enum(PRIORITIES).optional(),
    assignmentGroup: optionalText(200),
  })
  .strict();

export const UpdateTicketSchema = z
  .object({
    priority: z.enum(PRIORITIES).optional(),
    category: z.enum(CATEGORY_NAMES as [string, ...string[]]).optional(),
    subcategory: optionalText(100),
    orderNumber: optionalText(100),
    productSku: optionalText(100),
    productName: optionalText(300),
    batchCode: optionalText(100),
    purchaseChannel: z.enum(PURCHASE_CHANNELS).optional(),
    organization: optionalText(200),
    department: optionalText(200),
    customerName: optionalText(200),
    customerPhone: optionalText(50),
    assignmentGroup: optionalText(200),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'provide at least one field to update');

// ------------------------------------------------------------------------ refunds

export const RefundRequestSchema = z
  .object({
    amount: z.coerce.number().min(0).max(1_000_000),
    reason: requiredText(4000, 'reason'),
  })
  .strict();

export const RefundDecisionSchema = z
  .object({
    decision: z.enum(['Approved', 'Rejected']),
    /** Allows approving a different amount than requested. */
    amount: z.coerce.number().min(0).max(1_000_000).optional(),
    note: optionalText(4000),
  })
  .strict();

export const RefundSettleSchema = z
  .object({
    reference: optionalText(200),
    note: optionalText(4000),
  })
  .strict();

// ----------------------------------------------------------------------- comments

export const AddCommentSchema = z
  .object({
    body: requiredText(10_000, 'body'),
    authorType: z.enum(['Customer', 'Agent', 'System']),
    author: requiredText(200, 'author'),
    authorEmail: emailOptional,
    isInternal: z.coerce.boolean().default(false),
    channel: z.enum(CHANNELS).default('Web'),
    attachmentReferences: z.array(z.string().url()).max(20).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.isInternal && val.authorType === 'Customer') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['isInternal'],
        message: 'a customer message cannot be an internal note',
      });
    }
  });

export const CustomerReplySchema = z
  .object({
    body: requiredText(10_000, 'body'),
    attachmentReferences: z.array(z.string().url()).max(20).optional(),
  })
  .strict();

// -------------------------------------------------------------------- exceptions

export const ExceptionSearchSchema = z
  .object({
    resolved: z.coerce.boolean().optional(),
    exceptionType: z.enum(['Business', 'System']).optional(),
    exceptionReason: z.string().trim().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const ResolveExceptionSchema = z
  .object({
    note: optionalText(4000),
  })
  .strict();

// ------------------------------------------------------------------------- tokens

export const IssueTokenSchema = z
  .object({
    subject: requiredText(200, 'subject'),
    name: optionalText(200),
    roles: z.array(z.enum(['agent', 'supervisor', 'admin'])).min(1),
  })
  .strict();
