export interface SimulateNetworkOptions {
  delayMs?: number;
  failRate?: number;
  failMessage?: string;
}

/**
 * Wraps static/derived mock data in an artificial delay so TanStack Query's
 * loading states are still exercised for the few purely client-side helpers
 * (category suggestion, canned solutions). Live ticket data goes through the
 * real REST API via apiFetch() below.
 */
export function simulateNetwork<T>(
  data: T,
  { delayMs = 350, failRate = 0, failMessage = "Something went wrong. Please try again." }: SimulateNetworkOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (failRate > 0 && Math.random() < failRate) {
        reject(new Error(failMessage));
        return;
      }
      resolve(data);
    }, delayMs);
  });
}

/**
 * Thin wrapper over fetch for the /api/v1 REST layer. Unwraps the
 * `{ data }` envelope and throws a readable error on non-2xx responses.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return (payload?.data ?? payload) as T;
}
