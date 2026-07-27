"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";

import { useAgentSession } from "@/lib/agent-api/session";

/**
 * Gate for every console route.
 *
 * This is a convenience guard, not a security boundary — the API rejects an absent or
 * expired token on its own. It exists so an agent lands on sign-in instead of a page full
 * of 401s.
 */
export function RequireAgentSession({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAgentSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) router.replace("/agent/sign-in");
  }, [ready, session, router]);

  // `ready` is false until localStorage has been read. Redirecting before that would bounce
  // a signed-in agent to the login page on every hard refresh.
  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading session</span>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
