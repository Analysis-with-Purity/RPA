"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const REMEMBER_KEY = "purity-remember-email";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered) {
      setValue("email", remembered);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  async function onSubmit(data: LoginInput) {
    setServerError(null);

    if (data.rememberMe) {
      localStorage.setItem(REMEMBER_KEY, data.email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      setServerError("Invalid email or password.");
      return;
    }

    router.push(params.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your fragrance journey.">
      {params.get("registered") && (
        <p className="mb-6 text-xs bg-royal-light text-royal-dark px-4 py-3">
          Account created — check your email to verify, then sign in.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} placeholder="Your password" />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink/70">
            <input type="checkbox" {...register("rememberMe")} className="accent-royal" />
            Remember me
          </label>
          <Link href="/forgot-password" className="text-royal underline underline-offset-2">
            Forgot password?
          </Link>
        </div>

        {serverError && <p className="text-xs text-red-600">{serverError}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing In…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink/60">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-royal underline underline-offset-2">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
