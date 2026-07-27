import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/checkout";
import { calculateTotals, type PromoInfo } from "@/lib/cart-pricing";
import { bundlePricing, type BundleDetailData } from "@/lib/data/bundle-helpers";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await auth();
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  // Re-verify every line against the database — never trust client-sent prices.
  const verifiedItems: {
    productId: string | null;
    sizeId: string | null;
    name: string;
    brand: string;
    sizeLabel: string;
    image: string;
    price: number;
    quantity: number;
  }[] = [];

  const stockDecrements: { sizeId: string; quantity: number }[] = [];

  for (const item of data.items) {
    if (item.kind === "product") {
      if (!item.sizeId) {
        return NextResponse.json({ error: `Missing size for ${item.name}` }, { status: 400 });
      }
      const size = await prisma.productSize.findUnique({
        where: { id: item.sizeId },
        include: { product: { include: { brand: true } } },
      });
      if (!size) {
        return NextResponse.json({ error: `${item.name} is no longer available.` }, { status: 400 });
      }
      if (size.stock < item.quantity) {
        return NextResponse.json({ error: `${item.name} (${size.size}ml) is out of stock.` }, { status: 400 });
      }
      verifiedItems.push({
        productId: size.productId,
        sizeId: size.id,
        name: size.product.name,
        brand: size.product.brand.name,
        sizeLabel: `${size.size}ml`,
        image: item.image,
        price: size.price,
        quantity: item.quantity,
      });
      stockDecrements.push({ sizeId: size.id, quantity: item.quantity });
    } else {
      const bundle = await prisma.bundle.findUnique({
        where: { id: item.refId },
        include: {
          items: { include: { product: { include: { sizes: true, brand: true } }, size: true } },
        },
      });
      if (!bundle || !bundle.active) {
        return NextResponse.json({ error: `${item.name} is no longer available.` }, { status: 400 });
      }
      const { bundlePrice } = bundlePricing(bundle as unknown as BundleDetailData);
      verifiedItems.push({
        productId: null,
        sizeId: null,
        name: bundle.name,
        brand: "Purity Bundle",
        sizeLabel: `${bundle.items.length} items`,
        image: bundle.image,
        price: bundlePrice,
        quantity: item.quantity,
      });
    }
  }

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let promoRecord = null;
  let promoInfo: PromoInfo | null = null;
  if (data.promoCode) {
    promoRecord = await prisma.promoCode.findUnique({ where: { code: data.promoCode } });
    if (promoRecord && promoRecord.active && (!promoRecord.expiresAt || promoRecord.expiresAt > new Date())) {
      promoInfo = { code: promoRecord.code, discountType: promoRecord.discountType, discountValue: promoRecord.discountValue };
    }
  }

  const { discount, shippingFee, total } = calculateTotals(subtotal, promoInfo, data.deliveryOption);
  const orderNumber = `PUR${nanoid(8).toUpperCase()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: session?.user.id,
        guestEmail: session ? null : data.email,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        addressId: data.addressId || null,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        deliveryOption: data.deliveryOption,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        status: "PROCESSING",
        promoCodeId: promoRecord?.id,
        subtotal,
        discount,
        shippingFee,
        total,
        items: {
          create: verifiedItems.map((i) => ({
            productId: i.productId,
            sizeId: i.sizeId,
            name: i.name,
            brand: i.brand,
            sizeLabel: i.sizeLabel,
            image: i.image,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
    });

    for (const dec of stockDecrements) {
      await tx.productSize.update({
        where: { id: dec.sizeId },
        data: { stock: { decrement: dec.quantity } },
      });
    }

    return created;
  });

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.orderNumber, total });
}
