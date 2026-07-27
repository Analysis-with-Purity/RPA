"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons/social";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="bg-ink text-white/80 mt-24">
      <Container className="py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <span className="font-serif text-2xl tracking-[0.08em] text-white">PURITY</span>
          <p className="mt-4 text-sm leading-relaxed max-w-sm text-white/60">
            A luxury fragrance house crafting timeless, sophisticated scents for those who
            appreciate the art of perfumery. Authentic. Elegant. Unmistakably you.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-gold transition-colors"><InstagramIcon width={18} height={18} /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-gold transition-colors"><FacebookIcon width={18} height={18} /></a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" className="hover:text-gold transition-colors"><TikTokIcon width={18} height={18} /></a>
            <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="hover:text-gold transition-colors"><WhatsAppIcon width={18} height={18} /></a>
          </div>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-gold transition-colors">Shop All</Link></li>
            <li><Link href="/vibes" className="hover:text-gold transition-colors">Shop by Vibe</Link></li>
            <li><Link href="/bundles" className="hover:text-gold transition-colors">Combo Bundles</Link></li>
            <li><Link href="/about" className="hover:text-gold transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-white mb-4">Policies</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/faq" className="hover:text-gold transition-colors">FAQ</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-gold transition-colors">Shipping</Link></li>
            <li><Link href="/policies/returns" className="hover:text-gold transition-colors">Returns</Link></li>
            <li><Link href="/policies/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[11px] uppercase tracking-[0.18em] text-white mb-4">Newsletter</h4>
          <p className="text-sm text-white/60 mb-4">Be first to know about new arrivals and private offers.</p>
          <form onSubmit={subscribe} className="flex flex-col gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="bg-transparent border-white/25 text-white placeholder:text-white/40"
            />
            <Button type="submit" variant="gold" size="sm" className="border-gold text-gold hover:bg-gold hover:text-ink">
              {status === "loading" ? "Submitting…" : "Subscribe"}
            </Button>
            {status === "done" && <p className="text-xs text-gold">Thank you — you&apos;re subscribed.</p>}
            {status === "error" && <p className="text-xs text-red-400">Something went wrong, try again.</p>}
          </form>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="py-6 flex flex-col md:flex-row gap-2 items-center justify-between text-[11px] text-white/40">
          <p>© {new Date().getFullYear()} Purity Luxury Fragrance House. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Mail size={13} strokeWidth={1.4} />
            <a href="mailto:hello@purity-parfums.com" className="hover:text-gold">hello@purity-parfums.com</a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
