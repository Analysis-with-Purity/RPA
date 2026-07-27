"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders & Tracking" },
  { href: "/dashboard/wishlist", label: "Wishlist" },
  { href: "/dashboard/addresses", label: "Addresses" },
  { href: "/dashboard/payments", label: "Payment History" },
  { href: "/dashboard/profile", label: "Profile & Security" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r border-line pb-4 md:pb-0 md:pr-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "whitespace-nowrap px-4 py-3 text-sm border-l-2 border-transparent transition-colors",
            pathname === link.href
              ? "border-l-royal text-royal bg-white"
              : "text-ink/60 hover:text-ink hover:bg-white/60"
          )}
        >
          {link.label}
        </Link>
      ))}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="whitespace-nowrap px-4 py-3 text-sm text-left text-ink/60 hover:text-royal mt-2 md:mt-4 border-t border-line md:pt-4"
      >
        Logout
      </button>
    </nav>
  );
}
