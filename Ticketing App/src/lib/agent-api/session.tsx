"use client";

/**
 * Agent session: the JWT plus who it belongs to.
 *
 * Stored in localStorage. That is the right trade-off for a back-office console talking to
 * a separate-origin API — an httpOnly cookie cannot be read by the browser to set the
 * Authorization header, and the API is bearer-token only. It does mean the token is
 * XSS-reachable, so tokens are short-lived (JWT_TTL_SECONDS) and expiry is enforced here
 * too rather than trusted to the server alone.
 *
 * localStorage is an external store, so it is read through `useSyncExternalStore` rather
 * than mirrored into component state. That keeps every tab and every consumer reading the
 * same value, and avoids a render pass where the app believes it is signed out.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { DESK_UNAUTHORIZED_EVENT } from "./client";
import type { Role } from "./catalog";

const STORAGE_KEY = "purity.agent.session";
/** Same-tab change signal — `storage` events only fire in *other* tabs. */
const SESSION_CHANGED_EVENT = "desk-api:session-changed";

export interface AgentSession {
  token: string;
  /** The JWT subject — the agent's email, recorded as the actor on every write. */
  subject: string;
  name: string;
  roles: Role[];
  /** Epoch milliseconds. */
  expiresAt: number;
}

// --------------------------------------------------------------------- the store

// getSnapshot must return a stable reference when nothing changed, or React re-renders
// forever. Parsing is therefore memoised against the raw string.
let cachedRaw: string | null = null;
let cachedSession: AgentSession | null = null;

function parseSession(raw: string | null): AgentSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AgentSession;
    if (!parsed?.token || typeof parsed.expiresAt !== "number") return null;
    if (!Array.isArray(parsed.roles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getSessionSnapshot(): AgentSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = parseSession(raw);
  }

  // An expired token reads as no session. Storage is not cleared here — a snapshot must
  // stay side-effect free — the expiry timer below does that.
  if (cachedSession && cachedSession.expiresAt <= Date.now()) return null;

  return cachedSession;
}

function getServerSnapshot(): AgentSession | null {
  return null;
}

function subscribeToSession(onChange: () => void): () => void {
  window.addEventListener(SESSION_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeSession(next: AgentSession | null): void {
  if (typeof window === "undefined") return;
  if (next) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
}

/**
 * False during SSR and the hydration pass, true afterwards. Guards use it so a hard refresh
 * does not bounce a signed-in agent to the login page before storage has been consulted.
 */
const subscribeToNothing = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

// ------------------------------------------------------------------------ context

interface AgentSessionContextValue {
  session: AgentSession | null;
  ready: boolean;
  signIn: (session: AgentSession) => void;
  signOut: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AgentSessionContext = createContext<AgentSessionContextValue | null>(null);

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSnapshot,
  );
  const ready = useSyncExternalStore(subscribeToNothing, alwaysTrue, alwaysFalse);

  const router = useRouter();
  const queryClient = useQueryClient();

  const signIn = useCallback((next: AgentSession) => writeSession(next), []);

  const signOut = useCallback(() => {
    writeSession(null);
    // Drop cached ticket data — the next agent to sign in must not see it.
    queryClient.removeQueries({ queryKey: ["agent"] });
    router.replace("/agent/sign-in");
  }, [queryClient, router]);

  // Any 401 means the token is gone or rejected; clear it once, centrally, rather than
  // making every call site handle expiry.
  useEffect(() => {
    const onUnauthorized = () => signOut();
    window.addEventListener(DESK_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(DESK_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [signOut]);

  // Drop the token the moment it lapses instead of waiting for the next request to fail.
  // Clearing happens in the timer callback, never synchronously during the effect.
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => writeSession(null),
      Math.max(0, session.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [session]);

  const value = useMemo<AgentSessionContextValue>(
    () => ({
      session,
      ready,
      signIn,
      signOut,
      // `admin` satisfies every requirement, matching the API's requireRole().
      hasRole: (...roles: Role[]) => {
        const held = session?.roles ?? [];
        return held.includes("admin") || roles.some((r) => held.includes(r));
      },
    }),
    [session, ready, signIn, signOut],
  );

  return (
    <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>
  );
}

export function useAgentSession(): AgentSessionContextValue {
  const ctx = useContext(AgentSessionContext);
  if (!ctx) {
    throw new Error("useAgentSession must be used inside <AgentSessionProvider>.");
  }
  return ctx;
}

/** Convenience for hooks that only need the bearer token. */
export function useAgentToken(): string | null {
  return useAgentSession().session?.token ?? null;
}
