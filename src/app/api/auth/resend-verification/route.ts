import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken, appUrl } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });

  // Always return ok to avoid leaking whether an account exists
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const token = await createEmailVerificationToken(user.id);
  const link = `${appUrl()}/verify-email?token=${token}`;
  const result = await sendVerificationEmail(user.email, user.name, link);

  return NextResponse.json({ ok: true, devVerifyLink: result.devMode ? link : undefined });
}
