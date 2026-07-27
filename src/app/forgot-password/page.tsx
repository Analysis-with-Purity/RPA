"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

type Input_ = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [devLink, setDevLink] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input_>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: Input_) {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setDone(true);
    if (json.devResetLink) setDevLink(json.devResetLink);
  }

  if (done) {
    return (
      <AuthShell title="Check your email" subtitle="If an account exists, a reset link is on its way.">
        {devLink ? (
          <div className="border border-line p-6 bg-ivory text-sm space-y-4">
            <p>No live email provider is connected yet — here&apos;s your reset link:</p>
            <a href={devLink} className="block break-all text-royal underline">
              {devLink}
            </a>
            <Button href={devLink} variant="primary" size="sm">
              Reset Password Now
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink/60">Please check your inbox for further instructions.</p>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>
      <p className="mt-8 text-sm text-ink/60">
        Remembered your password?{" "}
        <Link href="/login" className="text-royal underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
