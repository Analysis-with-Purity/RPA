import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { productCardInclude, productPricing } from "@/lib/data/product-helpers";

export {
  productCardInclude,
  productPricing,
  parseImages,
  type ProductCardData,
} from "@/lib/data/product-helpers";

export async function getFeaturedProducts(
  flag: "isBestSeller" | "isNewArrival" | "isSignature" | "isLimitedEdition" | "isGiftSet",
  take = 8
) {
  return prisma.product.findMany({
    where: { [flag]: true },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getVibes() {
  return prisma.vibe.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getVibeBySlug(slug: string) {
  return prisma.vibe.findUnique({ where: { slug } });
}

export async function getProductsByVibe(slug: string) {
  return prisma.product.findMany({
    where: { vibes: { some: { vibe: { slug } } } },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}

export async function getFilterOptions() {
  const [families, longevities, projections, brands, sizes] = await Promise.all([
    prisma.product.findMany({ distinct: ["fragranceFamily"], select: { fragranceFamily: true } }),
    prisma.product.findMany({ distinct: ["longevity"], select: { longevity: true } }),
    prisma.product.findMany({ distinct: ["projection"], select: { projection: true } }),
    getBrands(),
    prisma.productSize.findMany({ distinct: ["size"], select: { size: true }, orderBy: { size: "asc" } }),
  ]);

  return {
    fragranceFamilies: families.map((f) => f.fragranceFamily).sort(),
    longevities: longevities.map((l) => l.longevity).sort(),
    projections: projections.map((p) => p.projection).sort(),
    brands,
    sizes: sizes.map((s) => s.size),
  };
}

export interface ProductFilters {
  q?: string;
  gender?: string;
  brandSlug?: string;
  fragranceFamily?: string;
  season?: string;
  occasion?: string;
  vibeSlug?: string;
  collection?: "best-sellers" | "new-arrivals" | "signature" | "limited-edition" | "gift-sets";
  minPrice?: number;
  maxPrice?: number;
  size?: number;
  longevity?: string;
  projection?: string;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
}

export async function searchProducts(filters: ProductFilters) {
  const where: Prisma.ProductWhereInput = {};
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q } },
        { brand: { name: { contains: filters.q } } },
        { fragranceFamily: { contains: filters.q } },
        { topNotes: { contains: filters.q } },
        { middleNotes: { contains: filters.q } },
        { baseNotes: { contains: filters.q } },
        { bestOccasion: { contains: filters.q } },
        { description: { contains: filters.q } },
      ],
    });
  }

  if (filters.gender) and.push({ gender: filters.gender as never });
  if (filters.brandSlug) and.push({ brand: { slug: filters.brandSlug } });
  if (filters.fragranceFamily) and.push({ fragranceFamily: filters.fragranceFamily });
  if (filters.season) and.push({ bestSeason: { contains: filters.season } });
  if (filters.occasion) and.push({ bestOccasion: { contains: filters.occasion } });
  if (filters.vibeSlug) and.push({ vibes: { some: { vibe: { slug: filters.vibeSlug } } } });
  if (filters.collection) {
    const flagMap = {
      "best-sellers": "isBestSeller",
      "new-arrivals": "isNewArrival",
      signature: "isSignature",
      "limited-edition": "isLimitedEdition",
      "gift-sets": "isGiftSet",
    } as const;
    and.push({ [flagMap[filters.collection]]: true });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    and.push({
      sizes: {
        some: {
          price: {
            gte: filters.minPrice ?? undefined,
            lte: filters.maxPrice ?? undefined,
          },
        },
      },
    });
  }
  if (filters.inStockOnly) {
    and.push({ sizes: { some: { stock: { gt: 0 } } } });
  }
  if (filters.size) {
    and.push({ sizes: { some: { size: filters.size } } });
  }
  if (filters.longevity) and.push({ longevity: filters.longevity });
  if (filters.projection) and.push({ projection: filters.projection });

  if (and.length) where.AND = and;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "newest" || !filters.sort
      ? { createdAt: "desc" }
      : filters.sort === "price-asc" || filters.sort === "price-desc" || filters.sort === "rating"
      ? { createdAt: "desc" } // secondary sort; primary sort applied client-side for computed fields
      : { createdAt: "desc" };

  let products = await prisma.product.findMany({
    where,
    include: productCardInclude,
    orderBy,
  });

  if (filters.minRating) {
    products = products.filter((p) => productPricing(p).avgRating >= filters.minRating!);
  }

  if (filters.sort === "price-asc" || filters.sort === "price-desc") {
    products.sort((a, b) => {
      const pa = productPricing(a).minPrice;
      const pb = productPricing(b).minPrice;
      return filters.sort === "price-asc" ? pa - pb : pb - pa;
    });
  } else if (filters.sort === "rating") {
    products.sort((a, b) => productPricing(b).avgRating - productPricing(a).avgRating);
  }

  return products;
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      sizes: { orderBy: { size: "asc" } },
      vibes: { include: { vibe: true } },
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getRelatedProducts(product: { id: string; fragranceFamily: string; gender: string }) {
  return prisma.product.findMany({
    where: {
      id: { not: product.id },
      OR: [{ fragranceFamily: product.fragranceFamily }, { gender: product.gender as never }],
    },
    include: productCardInclude,
    take: 4,
  });
}

export async function getUserWishlistProducts(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: { include: productCardInclude } },
    orderBy: { createdAt: "desc" },
  });
  return items.map((i) => i.product);
}

export async function getBundles() {
  return prisma.bundle.findMany({
    where: { active: true },
    include: {
      items: { include: { product: { include: { sizes: true } }, size: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBundleBySlug(slug: string) {
  return prisma.bundle.findUnique({
    where: { slug },
    include: {
      items: { include: { product: { include: { sizes: true, brand: true } }, size: true } },
    },
  });
}
