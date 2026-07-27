import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1).default("Home"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Enter a valid phone number"),
  line1: z.string().min(4, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2).default("Nigeria"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
