"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap, Share2, Check } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Button } from "@/components/ui/button";
import { formatNaira, cn } from "@/lib/utils";

interface SizeOption {
  id: string;
  size: number;
  price: number;
  stock: number;
}

export function PurchasePanel({
  productId,
  slug,
  name,
  brand,
  image,
  sizes,
}: {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  sizes: SizeOption[];
}) {
  const router = useRouter();
  const inStockSizes = sizes;
  const [selected, setSelected] = useState<SizeOption | undefined>(
    inStockSizes.find((s) => s.stock > 0) ?? inStockSizes[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  if (!selected) return null;
  const outOfStock = selected.stock <= 0;

  function addToCart() {
    if (!selected || outOfStock) return;
    addItem({
      key: `product-${productId}-${selected.id}`,
      kind: "product",
      refId: productId,
      sizeId: selected.id,
      name,
      brand,
      sizeLabel: `${selected.size}ml`,
      image,
      price: selected.price,
      quantity,
      slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function buyNow() {
    addToCart();
    router.push("/checkout");
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <div>
      <p className="font-serif text-2xl text-royal">{formatNaira(selected.price)}</p>

      <div className="mt-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink/50 mb-3">Size</p>
        <div className="flex gap-2">
          {inStockSizes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              disabled={s.stock <= 0}
              className={cn(
                "border px-4 py-2 text-sm transition-colors",
                selected.id === s.id ? "border-royal text-royal" : "border-line text-ink/70",
                s.stock <= 0 && "opacity-30 line-through cursor-not-allowed"
              )}
            >
              {s.size}ml
            </button>
          ))}
        </div>
        {outOfStock && <p className="text-xs text-red-600 mt-2">This size is out of stock.</p>}
        {!outOfStock && selected.stock <= 6 && (
          <p className="text-xs text-royal mt-2">Only {selected.stock} left in stock.</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink/50">Qty</p>
        <div className="flex items-center border border-line">
          <button className="px-3 py-2" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            −
          </button>
          <span className="px-4 text-sm">{quantity}</span>
          <button className="px-3 py-2" onClick={() => setQuantity((q) => q + 1)}>
            +
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button onClick={addToCart} disabled={outOfStock} size="lg" variant="outline" className="flex-1">
          {added ? (
            <>
              <Check size={15} /> Added
            </>
          ) : (
            <>
              <ShoppingBag size={15} /> Add to Cart
            </>
          )}
        </Button>
        <Button onClick={buyNow} disabled={outOfStock} size="lg" className="flex-1">
          <Zap size={15} /> Buy Now
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={share}
          className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink/60 hover:text-royal border border-line px-4 py-2"
        >
          <Share2 size={14} /> {shared ? "Link Copied" : "Share"}
        </button>
        <WishlistButton productId={productId} className="static bg-white border-line" />
      </div>
    </div>
  );
}
