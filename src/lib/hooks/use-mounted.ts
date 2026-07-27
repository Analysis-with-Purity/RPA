"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 * Used to defer rendering of client-only state (e.g. zustand `persist`
 * stores backed by localStorage) until after hydration, avoiding a
 * server/client markup mismatch.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration flag, not a synchronization effect
    setMounted(true);
  }, []);
  return mounted;
}
