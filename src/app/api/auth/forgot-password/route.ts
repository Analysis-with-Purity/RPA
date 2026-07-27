import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken, appUrl } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });

  // Always respond ok — never reveal whether an account exists
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = await createPasswordResetToken(user.id);
  const link = `${appUrl()}/reset-password?token=${token}`;
  const result = await sendPasswordResetEmail(user.email, user.name, link);

  return NextResponse.json({ ok: true, devResetLink: result.devMode ? link : undefined });
}
