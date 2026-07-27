"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, InfoIcon, Loader2Icon } from "lucide-react";

import { loginSchema, type LoginInput, DEMO_CREDENTIALS } from "@/lib/validations/auth-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SocialButtons } from "@/components/auth/SocialButtons";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginInput) {
    setAuthError(null);
    setSubmitting(true);

    // Simulated auth check against the frontend-only demo credentials.
    await new Promise((resolve) => setTimeout(resolve, 700));

    const ok =
      values.email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
      values.password === DEMO_CREDENTIALS.password;

    if (!ok) {
      setSubmitting(false);
      setAuthError("Those credentials don't match. Use the demo login below.");
      return;
    }

    toast.success("Welcome back!", { description: "Redirecting to your dashboardâ€¦" });
    router.push("/dashboard");
  }

  function fillDemo() {
    form.setValue("email", DEMO_CREDENTIALS.email, { shouldValidate: true });
    form.setValue("password", DEMO_CREDENTIALS.password, { shouldValidate: true });
    setAuthError(null);
  }

  return (
    <div className="space-y-6">
      <SocialButtons />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {authError && (
        <Alert variant="destructive">
          <InfoIcon />
          <AlertTitle>Sign in failed</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="#"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              {...form.register("remember")}
            />
            Remember me for 30 days
          </label>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2Icon className="animate-spin" />}
            {submitting ? "Signing inâ€¦" : "Sign in"}
          </Button>
        </form>
      </Form>

      {/* Demo credentials hint */}
      <div className="rounded-lg border border-primary/30 bg-primary-muted/40 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-primary">Demo credentials</p>
          <Button type="button" size="sm" variant="default" onClick={fillDemo}>
            Fill &amp; try
          </Button>
        </div>
        <dl className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
          <div className="flex justify-between gap-4">
            <dt>Email</dt>
            <dd className="text-foreground">{DEMO_CREDENTIALS.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Password</dt>
            <dd className="text-foreground">{DEMO_CREDENTIALS.password}</dd>
          </div>
        </dl>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Start a free trial
        </Link>
      </p>
    </div>
  );
}
