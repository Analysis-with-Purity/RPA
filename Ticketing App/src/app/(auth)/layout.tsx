import Link from "next/link";
import { ArrowLeftIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

const HIGHLIGHTS = [
  { icon: SparklesIcon, text: "AI triage and instant ticket summaries" },
  { icon: ZapIcon, text: "Resolve tickets 3Ã— faster on average" },
  { icon: ShieldCheckIcon, text: "SOC 2 Type II. SSO and audit logs." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-24 -left-16 size-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-0 bottom-0 size-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <Link href="/" className="relative flex items-center gap-2 text-primary-foreground">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15 text-sm font-bold backdrop-blur">
            P
          </div>
          <span className="text-lg font-semibold tracking-tight">Purity</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-primary-foreground">
            Customer support that customers actually love.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 backdrop-blur">
                  <item.icon className="size-4" />
                </span>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/70">
          &ldquo;We cut our first-response time by 63% in the first month.&rdquo; â€” Amara O., Northwind
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" /> Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center p-4 pb-16 sm:p-6">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
