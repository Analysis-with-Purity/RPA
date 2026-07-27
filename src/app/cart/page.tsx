"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMounted } from "@/lib/hooks/use-mounted";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/utils";
import { calculateTotals, FREE_SHIPPING_THRESHOLD } from "@/lib/cart-pricing";

export default function CartPage() {
  const mounted = useMounted();

  const lines = useCartStore((s) => s.lines);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const promo = useCartStore((s) => s.promo);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const subtotal = useCartStore((s) => s.subtotal());

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const { discount, shippingFee, total } = calculateTotals(subtotal, promo);

  async function applyPromoCode(e: React.FormEvent) {
    e.preventDefault();
    setApplying(true);
    setPromoError(null);
    const res = await fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoInput }),
    });
    const json = await res.json();
    setApplying(false);
    if (!res.ok) {
      setPromoError(json.error);
      return;
    }
    applyPromo({ code: json.code, discountType: json.discountType, discountValue: json.discountValue });
    setPromoInput("");
  }

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="bg-ivory border-b border-line py-10">
        <Container>
          <h1 className="font-serif text-3xl">Shopping Bag</h1>
        </Container>
      </div>

      <Container className="py-12">
        {lines.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink/50 mb-6">Your bag is empty.</p>
            <Button href="/shop">Continue Shopping</Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-14">
            <div className="divide-y divide-line border-y border-line">
              {lines.map((line) => (
                <div key={line.key} className="flex gap-5 py-6">
                  <Link href={`/${line.kind === "bundle" ? "bundles" : "product"}/${line.slug}`} className="relative w-24 h-28 shrink-0 bg-porcelain">
                    <Image src={line.image} alt={line.name} fill sizes="100px" className="object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-4">
                      <div>
                        {line.brand && <p className="text-[11px] uppercase tracking-wide text-ink/40">{line.brand}</p>}
                        <Link href={`/${line.kind === "bundle" ? "bundles" : "product"}/${line.slug}`} className="font-serif text-lg hover:text-royal">
                          {line.name}
                        </Link>
                        <p className="text-xs text-ink/40 mt-1">{line.sizeLabel}</p>
                      </div>
                      <p className="text-sm whitespace-nowrap">{formatNaira(line.price * line.quantity)}</p>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center border border-line">
                        <button
                          className="px-3 py-1.5"
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="px-4 text-sm">{line.quantity}</span>
                        <button
                          className="px-3 py-1.5"
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(line.key)}
                        className="flex items-center gap-1 text-xs text-red-600"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="bg-ivory p-6 space-y-4">
                <h2 className="font-serif text-lg mb-2">Order Summary</h2>

                <form onSubmit={applyPromoCode} className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                  />
                  <Button type="submit" variant="outline" size="sm" disabled={applying}>
                    Apply
                  </Button>
                </form>
                {promoError && <p className="text-xs text-red-600">{promoError}</p>}
                {promo && (
                  <p className="text-xs text-royal">
                    Code <strong>{promo.code}</strong> applied.{" "}
                    <button onClick={() => applyPromo(null)} className="underline">
                      Remove
                    </button>
                  </p>
                )}

                <div className="space-y-2 text-sm pt-2 border-t border-line">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Subtotal</span>
                    <span>{formatNaira(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-royal">
                      <span>Discount</span>
                      <span>−{formatNaira(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink/60">Shipping</span>
                    <span>{shippingFee === 0 ? "Free" : formatNaira(shippingFee)}</span>
                  </div>
                  {shippingFee > 0 && (
                    <p className="text-[11px] text-ink/40">
                      Free shipping on orders over {formatNaira(FREE_SHIPPING_THRESHOLD)}
                    </p>
                  )}
                  <p className="text-[11px] text-ink/40">Estimated delivery: 3–5 business days</p>
                </div>

                <div className="flex justify-between pt-3 border-t border-line font-medium text-base">
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>

                <Button href="/checkout" size="lg" className="w-full mt-2">
                  Proceed to Checkout <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
