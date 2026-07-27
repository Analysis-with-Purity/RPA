import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border bg-primary px-6 py-16 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-30">
          <div className="absolute -top-20 left-1/4 size-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 size-72 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-primary-foreground sm:text-4xl">
            Ready to give your customers support they&apos;ll love?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80 text-pretty">
            Join thousands of teams resolving faster with Purity. Start your free trial in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="default" className="w-full sm:w-auto">
              <Link href="/dashboard">
                Start free trial <ArrowRightIcon />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
            >
              <Link href="/dashboard">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
