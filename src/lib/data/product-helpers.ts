import type { Prisma } from "@/generated/prisma/client";

export const productCardInclude = {
  brand: true,
  sizes: { orderBy: { size: "asc" as const } },
  reviews: { select: { rating: true } },
  vibes: { include: { vibe: true } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function productPricing(product: ProductCardData) {
  const prices = product.sizes.map((s) => s.price);
  const inStock = product.sizes.some((s) => s.stock > 0);
  const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  return {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    inStock,
    lowStock: inStock && totalStock <= 6,
    avgRating,
    reviewCount: product.reviews.length,
  };
}

export function parseImages(images: string): string[] {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr : [images];
  } catch {
    return [images];
  }
}
