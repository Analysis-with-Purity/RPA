"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  HeadsetIcon,
  LoaderCircleIcon,
  ServerCrashIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DESK_API_BASE, DeskApiError, requestDevToken } from "@/lib/agent-api/client";
import { getHealth } from "@/lib/agent-api/endpoints";
import { agentKeys } from "@/lib/agent-api/keys";
import { useAgentSession } from "@/lib/agent-api/session";
import type { Role } from "@/lib/agent-api/catalog";

const ROLE_OPTIONS: Array<{ value: Role; label: string; hint: string }> = [
  { value: "agent", label: "Agent", hint: "Day-to-day queue work" },
  { value: "supervisor", label: "Supervisor", hint: "Refunds, escalations, exceptions" },
  { value: "admin", label: "Admin", hint: "Everything" },
];

export default function AgentSignInPage() {
  const router = useRouter();
  const { session, ready, signIn } = useAgentSession();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<Role[]>(["agent", "supervisor"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<DeskApiError | null>(null);

  // Probing health up front turns "the form silently fails" into a visible, explainable state.
  const health = useQuery({
    queryKey: agentKeys.health,
    queryFn: getHealth,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (ready && session) router.replace("/agent/queue");
  }, [ready, session, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(
        new DeskApiError({
          message: "Enter the email address the token should be issued to.",
          status: 400,
          code: "validation_error",
        }),
      );
      return;
    }
    if (roles.length === 0) {
      setError(
        new DeskApiError({
          message: "Select at least one role — the API rejects a token with none.",
          status: 400,
          code: "validation_error",
        }),
      );
      return;
    }

    setSubmitting(true);
    try {
      const subject = email.trim();
      const displayName = name.trim() || subject;
      const result = await requestDevToken({ subject, name: displayName, roles });

      signIn({
        token: result.accessToken,
        subject,
        name: displayName,
        roles: result.roles,
        expiresAt: Date.now() + result.expiresIn * 1000,
      });
      router.replace("/agent/queue");
    } catch (err) {
      setError(
        err instanceof DeskApiError
          ? err
          : new DeskApiError({
              message: err instanceof Error ? err.message : "Sign-in failed.",
              status: 0,
              code: "unknown_error",
            }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/30 p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 size-[32rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-32 size-[28rem] rounded-full bg-primary/5 blur-3xl"
      />

      <Card className="relative w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HeadsetIcon className="size-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl">Agent console</CardTitle>
            <CardDescription>
              Sign in to work the support queue. This mints a development token from the
              Support Desk API.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <ApiStatus
            isLoading={health.isLoading}
            isError={health.isError}
            brand={health.data?.brand}
          />

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-email">Work email</Label>
              <Input
                id="agent-email"
                type="email"
                autoComplete="email"
                placeholder="rae.whitfield@maisonfragrance.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Becomes the token subject, and the actor recorded on every action you take.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-name">Display name</Label>
              <Input
                id="agent-name"
                autoComplete="name"
                placeholder="Rae Whitfield"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                className="w-full"
                value={roles}
                onValueChange={(value: string[]) => setRoles(value as Role[])}
              >
                {ROLE_OPTIONS.map((role) => (
                  <ToggleGroupItem
                    key={role.value}
                    value={role.value}
                    aria-label={role.label}
                    disabled={submitting}
                    className="flex-1 data-[state=on]:bg-primary-muted data-[state=on]:text-primary"
                  >
                    {role.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                {roles.includes("supervisor") || roles.includes("admin")
                  ? "Supervisor unlocks refund decisions, escalation and intake exceptions."
                  : "Agent alone cannot decide refunds, escalate, or view intake exceptions."}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <ServerCrashIcon />
                <AlertTitle>
                  {error.status === 403
                    ? "Token minting is disabled"
                    : "Could not sign in"}
                </AlertTitle>
                <AlertDescription>
                  <p>{error.message}</p>
                  {error.status === 403 && (
                    <p>
                      The API is running in production mode. Issue an agent token from your
                      identity provider instead.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircleIcon className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Enter console <ArrowRightIcon />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Looking for the customer portal?{" "}
            <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">
              Go there instead
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function ApiStatus({
  isLoading,
  isError,
  brand,
}: {
  isLoading: boolean;
  isError: boolean;
  brand?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
        <LoaderCircleIcon className="size-3.5 animate-spin" />
        Contacting {DESK_API_BASE}…
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <ServerCrashIcon />
        <AlertTitle>API unreachable</AlertTitle>
        <AlertDescription>
          <p>
            Nothing answered at <span className="font-mono text-xs">{DESK_API_BASE}</span>.
          </p>
          <p>
            Start the Support Desk API (<span className="font-mono text-xs">npm run dev</span>{" "}
            in <span className="font-mono text-xs">SupportDeskApi</span>), or point{" "}
            <span className="font-mono text-xs">NEXT_PUBLIC_SUPPORT_DESK_API_URL</span> at it.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-muted px-3 py-2 text-xs text-success">
      <CheckCircle2Icon className="size-3.5" />
      <span className="flex-1">
        Connected{brand ? ` to ${brand}` : ""} · {DESK_API_BASE}
      </span>
      <ShieldCheckIcon className="size-3.5" />
    </div>
  );
}
