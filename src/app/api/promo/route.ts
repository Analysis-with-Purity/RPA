import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: null }));
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!promo || !promo.active || (promo.expiresAt && promo.expiresAt < new Date())) {
    return NextResponse.json({ error: "This promo code is invalid or has expired." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
  });
}
