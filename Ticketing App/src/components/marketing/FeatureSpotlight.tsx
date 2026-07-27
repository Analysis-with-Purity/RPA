import { CheckIcon, SparklesIcon } from "lucide-react";

const AI_POINTS = [
  "Auto-categorize and route tickets the moment they arrive",
  "One-click AI replies drafted in your brand voice",
  "Instant summaries so agents skip the back-scroll",
  "Duplicate detection that keeps the queue clean",
];

export function FeatureSpotlight() {
  return (
    <section id="solutions" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-muted px-3 py-1 text-xs font-medium text-primary">
              <SparklesIcon className="size-3.5" /> AI-first support
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Let AI handle the busywork, so your team handles the moments that matter
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Purity&apos;s assistant reads every incoming ticket, drafts a response, and hands your
              agents a running head start â€” cutting resolution times without cutting corners.
            </p>
            <ul className="mt-6 space-y-3">
              {AI_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-muted text-[color:var(--success)]">
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Faux AI reply card */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/10 blur-2xl" />
            <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  JD
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
                  My invoice shows a charge I don&apos;t recognize from last week â€” can you help?
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary-muted/40 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <SparklesIcon className="size-3.5" /> AI suggested reply &bull; Billing
                </p>
                <p className="mt-2 text-sm">
                  Hi James â€” I looked into it. The charge on Jul 3 was a prorated upgrade to your
                  Professional plan. I&apos;ve attached the itemized invoice. Want me to walk through
                  it?
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    Send reply
                  </span>
                  <span className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground">
                    Edit
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span>Resolved in 41 seconds</span>
                <span className="flex items-center gap-1 text-[color:var(--success)]">
                  <CheckIcon className="size-3.5" /> CSAT 5/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
