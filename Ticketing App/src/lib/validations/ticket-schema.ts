import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(8, "Give it a bit more detail — at least 8 characters.")
    .max(140, "Keep the subject under 140 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the issue in at least 20 characters.")
    .max(4000, "Keep the description under 4000 characters."),
  categoryId: z.string().min(1, "Choose a category."),
  departmentId: z.string().min(1, "Choose a department."),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  tags: z.array(z.string()).max(8, "Up to 8 tags."),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileSizeBytes: z.number(),
        mimeType: z.string(),
      })
    )
    .max(5, "Up to 5 attachments."),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const replyMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a reply before sending.")
    .max(4000, "Keep replies under 4000 characters."),
});

export type ReplyMessageInput = z.infer<typeof replyMessageSchema>;
