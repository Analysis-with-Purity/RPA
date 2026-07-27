import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

export async function createEmailVerificationToken(userId: string) {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export async function createPasswordResetToken(userId: string) {
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export function appUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
