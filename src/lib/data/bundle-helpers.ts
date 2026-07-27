import type { Prisma } from "@/generated/prisma/client";

export const bundleDetailInclude = {
  items: { include: { product: { include: { sizes: true, brand: true } }, size: true } },
} satisfies Prisma.BundleInclude;

export type BundleDetailData = Prisma.BundleGetPayload<{ include: typeof bundleDetailInclude }>;

export function bundleItemPrice(item: BundleDetailData["items"][number]) {
  if (item.size) return item.size.price;
  const cheapest = [...item.product.sizes].sort((a, b) => a.price - b.price)[0];
  return cheapest?.price ?? 0;
}

export function bundlePricing(bundle: BundleDetailData) {
  const originalTotal = bundle.items.reduce(
    (sum, item) => sum + bundleItemPrice(item) * item.quantity,
    0
  );
  const discountAmount =
    bundle.discountType === "PERCENT"
      ? originalTotal * (bundle.discountValue / 100)
      : bundle.discountValue;
  const bundlePrice = Math.max(0, originalTotal - discountAmount);

  return { originalTotal, bundlePrice, discountAmount };
}
