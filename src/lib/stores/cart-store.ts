"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PromoInfo } from "@/lib/cart-pricing";

export interface CartLine {
  key: string; // unique line key: productId-sizeId OR bundle-bundleId
  kind: "product" | "bundle";
  refId: string; // productId or bundleId
  sizeId?: string;
  name: string;
  brand?: string;
  sizeLabel: string;
  image: string;
  price: number;
  quantity: number;
  slug: string;
}

interface CartState {
  lines: CartLine[];
  promo: PromoInfo | null;
  addItem: (item: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  applyPromo: (promo: PromoInfo | null) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promo: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.lines.find((l) => l.key === item.key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === item.key
                  ? { ...l, quantity: l.quantity + (item.quantity ?? 1) }
                  : l
              ),
            };
          }
          return {
            lines: [...state.lines, { ...item, quantity: item.quantity ?? 1 }],
          };
        }),
      removeItem: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l))
            .filter((l) => l.quantity > 0),
        })),
      applyPromo: (promo) => set({ promo }),
      clear: () => set({ lines: [], promo: null }),
      count: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    }),
    { name: "purity-cart" }
  )
);
