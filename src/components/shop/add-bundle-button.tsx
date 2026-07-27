"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";

export function AddBundleButton({
  bundleId,
  slug,
  name,
  image,
  price,
}: {
  bundleId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function onAdd() {
    addItem({
      key: `bundle-${bundleId}`,
      kind: "bundle",
      refId: bundleId,
      name,
      sizeLabel: "Bundle",
      image,
      price,
      slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Button onClick={onAdd} size="lg" className="w-full sm:w-auto">
      {added ? (
        <>
          <Check size={15} /> Added to Bag
        </>
      ) : (
        <>
          <ShoppingBag size={15} /> Add Bundle to Cart
        </>
      )}
    </Button>
  );
}
