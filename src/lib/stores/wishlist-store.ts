"use client";

import { create } from "zustand";

interface WishlistState {
  ids: Set<string>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<boolean>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    const res = await fetch("/api/wishlist");
    const json = await res.json();
    set({ ids: new Set(json.productIds ?? []), loaded: true });
  },
  toggle: async (productId: string) => {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) return false;
    const json = await res.json();
    set((state) => {
      const next = new Set(state.ids);
      if (json.wishlisted) next.add(productId);
      else next.delete(productId);
      return { ids: next };
    });
    return true;
  },
}));
