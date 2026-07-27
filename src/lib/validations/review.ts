import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2, "Please add a short title").max(100),
  comment: z.string().min(10, "Please write at least 10 characters").max(2000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
