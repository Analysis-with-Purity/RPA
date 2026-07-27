import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { formatNaira } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { reference } = await req.json().catch(() => ({ reference: undefined }));

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updated = await prisma.order.update({
    where: { id },
    data: { paymentStatus: "PAID", paymentRef: reference ?? null },
  });

  await sendOrderConfirmationEmail(updated.email, updated.fullName, updated.orderNumber, formatNaira(updated.total));

  return NextResponse.json({ ok: true });
}
