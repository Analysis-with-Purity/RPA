"use client";

import { useState } from "react";

export function EmailVerifyBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);

  async function resend() {
    setStatus("sending");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    setStatus("sent");
    if (json.devVerifyLink) setDevLink(json.devVerifyLink);
  }

  return (
    <div className="border border-gold/50 bg-gold-soft/30 px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm text-ink/80">
        Your email address is not verified yet. Please verify to unlock all account features.
      </p>
      <div className="flex items-center gap-3 shrink-0">
        {status === "sent" && !devLink && <span className="text-xs text-ink/60">Sent!</span>}
        {devLink && (
          <a href={devLink} className="text-xs text-royal underline">
            Verify now
          </a>
        )}
        <button
          onClick={resend}
          disabled={status === "sending"}
          className="text-[11px] uppercase tracking-[0.14em] border border-ink px-4 py-2 hover:bg-ink hover:text-white transition-colors"
        >
          {status === "sending" ? "Sending…" : "Resend Email"}
        </button>
      </div>
    </div>
  );
}
