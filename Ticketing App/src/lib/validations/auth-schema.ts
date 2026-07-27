import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Enter your email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Frontend-only demo credentials. There is no real auth backend yet — the
 * login form checks against these and redirects into the app on a match.
 */
export const DEMO_CREDENTIALS = {
  email: "demo@puritysupport.com",
  password: "demo1234",
} as const;
