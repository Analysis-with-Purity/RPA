import Link from "next/link";
import { ArrowRightIcon, PlayIcon, SparklesIcon, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glows + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 right-0 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px]"
          aria-hidden
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href="#features"
            className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-primary">
              <SparklesIcon className="size-3" /> New
            </span>
            AI ticket triage &amp; instant summaries
            <ArrowRightIcon className="size-3" />
          </a>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Customer support that customers{" "}
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              actually love
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
            Resolve tickets faster, automate support with AI, and delight customers from one
            powerful platform â€” built for the speed and scale of a modern team.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="default" className="w-full sm:w-auto">
              <Link href="/dashboard">
                Start free trial <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard">
                <PlayIcon /> Live demo
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
            <span className="flex items-center gap-1">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="size-4 fill-primary text-primary" />
                ))}
              </span>
              4.9/5 from 2,000+ teams
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>No credit card required</span>
          </div>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-3xl bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
