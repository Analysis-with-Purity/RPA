import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validations/review";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Please sign in to leave a review." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { productId, rating, title, comment } = parsed.data;

  const purchase = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: session.user.id, paymentStatus: "PAID" },
    },
  });

  const review = await prisma.review.create({
    data: {
      productId,
      userId: session.user.id,
      rating,
      title,
      comment,
      verifiedPurchase: !!purchase,
    },
  });

  return NextResponse.json({ ok: true, review });
}
