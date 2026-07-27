import type { Metadata } from "next";

import { AgentSessionProvider } from "@/lib/agent-api/session";

export const metadata: Metadata = {
  title: "Agent Console · Purity Support",
  description: "Back-office console for the Support Desk API.",
};

/**
 * Wraps everything under /agent in the session context. Sign-in lives inside this boundary
 * too, since it is what populates the session.
 */
export default function AgentRootLayout({ children }: { children: React.ReactNode }) {
  return <AgentSessionProvider>{children}</AgentSessionProvider>;
}
