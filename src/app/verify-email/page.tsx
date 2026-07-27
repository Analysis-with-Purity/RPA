"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return <AuthShell title="Verifying your email…" />;
  }

  if (status === "error") {
    return (
      <AuthShell title="Verification failed" subtitle="This link is invalid or has expired.">
        <Button href="/login" variant="outline">
          Back to Sign In
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email verified" subtitle="Your account is now fully active.">
      <Button href="/login" size="lg">
        Continue to Sign In
      </Button>
    </AuthShell>
  );
}
