"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const load = useWishlistStore((s) => s.load);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.ids.has(productId));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }
    setPending(true);
    await toggle(productId);
    setPending(false);
  }

  return (
    <button
      aria-label="Toggle wishlist"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "h-9 w-9 flex items-center justify-center bg-white/90 backdrop-blur border border-line hover:border-gold transition-colors",
        className
      )}
    >
      <Heart
        size={16}
        strokeWidth={1.4}
        className={cn(isWishlisted ? "fill-royal text-royal" : "text-ink/60")}
      />
    </button>
  );
}
