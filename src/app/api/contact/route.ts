import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Please enter a subject"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, phone, subject, message } = parsed.data;

  await prisma.contactMessage.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone: phone && phone.length > 0 ? phone : null,
      subject,
      message,
    },
  });

  return NextResponse.json({ ok: true });
}
