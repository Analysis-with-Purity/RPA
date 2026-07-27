"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/vibes", label: "Shop by Vibe" },
  { href: "/collections", label: "Collections" },
  { href: "/bundles", label: "Bundles" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const count = useCartStore((s) => s.count());

  const isHome = pathname === "/";

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-line",
        isHome && "border-transparent"
      )}
    >
      <div className="bg-ink text-white text-center text-[11px] tracking-[0.18em] py-2 uppercase">
        Complimentary delivery on orders over ₦150,000 · Authenticity guaranteed
      </div>

      <Container className="flex items-center justify-between h-20">
        <button
          aria-label="Open menu"
          className="lg:hidden p-2 -ml-2"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} strokeWidth={1.4} />
        </button>

        <Link
          href="/"
          className="font-serif text-2xl md:text-[26px] tracking-[0.08em] text-ink"
        >
          PURITY
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[12px] uppercase tracking-[0.14em] text-ink/70 hover:text-royal transition-colors relative py-1",
                "after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full",
                pathname === link.href && "text-ink after:w-full"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            aria-label="Search"
            className="p-2 hover:text-royal transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={19} strokeWidth={1.4} />
          </button>

          <Link
            href={session ? "/dashboard/wishlist" : "/login"}
            aria-label="Wishlist"
            className="p-2 hover:text-royal transition-colors hidden sm:inline-flex"
          >
            <Heart size={19} strokeWidth={1.4} />
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative p-2 hover:text-royal transition-colors"
          >
            <ShoppingBag size={19} strokeWidth={1.4} />
            {count > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-royal text-white text-[9px]">
                {count}
              </span>
            )}
          </Link>

          <div className="relative group hidden sm:block">
            <Link
              href={session ? "/dashboard" : "/login"}
              aria-label="Account"
              className="p-2 hover:text-royal transition-colors inline-flex"
            >
              <User size={19} strokeWidth={1.4} />
            </Link>
            {session && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-line shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
                <p className="px-4 py-2 text-xs text-ink/50 truncate border-b border-line mb-1">
                  {session.user?.name}
                </p>
                <Link href="/dashboard" className="block px-4 py-2 text-xs uppercase tracking-wide hover:bg-ivory">
                  Dashboard
                </Link>
                <Link href="/dashboard/orders" className="block px-4 py-2 text-xs uppercase tracking-wide hover:bg-ivory">
                  Orders
                </Link>
                <Link href="/dashboard/wishlist" className="block px-4 py-2 text-xs uppercase tracking-wide hover:bg-ivory">
                  Wishlist
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-4 py-2 text-xs uppercase tracking-wide hover:bg-ivory text-royal"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm animate-fade-up" style={{ animationDuration: "0.25s" }}>
          <div className="bg-white border-b border-line">
            <Container className="py-8">
              <form onSubmit={submitSearch} className="flex items-center gap-4">
                <Search size={20} strokeWidth={1.4} className="text-ink/40" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search perfumes, brands, notes, occasions..."
                  className="flex-1 text-lg md:text-2xl font-serif outline-none placeholder:text-ink/30"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="p-2"
                >
                  <X size={22} strokeWidth={1.4} />
                </button>
              </form>
            </Container>
          </div>
          <div className="h-full" onClick={() => setSearchOpen(false)} />
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white">
          <Container className="flex items-center justify-between h-20 border-b border-line">
            <span className="font-serif text-2xl tracking-[0.08em]">PURITY</span>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-2">
              <X size={22} strokeWidth={1.4} />
            </button>
          </Container>
          <nav className="flex flex-col px-6 py-8 gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-xl font-serif text-ink"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-line my-2" />
            <Link href={session ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-wide text-royal">
              {session ? "My Dashboard" : "Login / Register"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
