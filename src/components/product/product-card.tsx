"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { productPricing, parseImages, type ProductCardData } from "@/lib/data/product-helpers";
import { formatNaira } from "@/lib/utils";
import { StarRating } from "@/components/product/star-rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Badge, GoldBadge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart-store";

export function ProductCard({ product }: { product: ProductCardData }) {
  const { minPrice, maxPrice, inStock, lowStock, avgRating, reviewCount } = productPricing(product);
  const images = parseImages(product.images);
  const addItem = useCartStore((s) => s.addItem);
  const cheapestSize = [...product.sizes].sort((a, b) => a.price - b.price)[0];

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!cheapestSize || cheapestSize.stock <= 0) return;
    addItem({
      key: `product-${product.id}-${cheapestSize.id}`,
      kind: "product",
      refId: product.id,
      sizeId: cheapestSize.id,
      name: product.name,
      brand: product.brand.name,
      sizeLabel: `${cheapestSize.size}ml`,
      image: images[0],
      price: cheapestSize.price,
      slug: product.slug,
    });
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block bg-white border border-line hover:border-gold/70 transition-colors duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-porcelain">
        <Image
          src={images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {images[1] && (
          <Image
            src={images[1]}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isBestSeller && <GoldBadge>Bestseller</GoldBadge>}
          {product.isNewArrival && <Badge>New</Badge>}
          {product.isLimitedEdition && <Badge className="border-royal text-royal">Limited</Badge>}
        </div>

        <WishlistButton productId={product.id} className="absolute top-3 right-3" />

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-[0.2em] bg-ink text-white px-4 py-2">
              Out of Stock
            </span>
          </div>
        )}

        {inStock && (
          <button
            onClick={quickAdd}
            className="absolute bottom-0 inset-x-0 bg-ink text-white text-[11px] uppercase tracking-[0.16em] py-3 flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            <ShoppingBag size={14} strokeWidth={1.4} /> Quick Add
          </button>
        )}
      </div>

      <div className="p-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink/40">{product.brand.name}</p>
        <h3 className="font-serif text-base mt-1 text-ink leading-snug">{product.name}</h3>

        <div className="flex items-center justify-between mt-2">
          <StarRating rating={avgRating} count={reviewCount} />
          <span className="text-[11px] text-ink/40 uppercase">{product.gender.toLowerCase()}</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-sm font-medium">
            {minPrice === maxPrice ? formatNaira(minPrice) : `From ${formatNaira(minPrice)}`}
          </p>
          <p className="text-[11px] text-ink/40">
            {product.sizes.map((s) => `${s.size}ml`).join(" / ")}
          </p>
        </div>
        {lowStock && <p className="text-[11px] text-royal mt-1">Only a few left</p>}
      </div>
    </Link>
  );
}
