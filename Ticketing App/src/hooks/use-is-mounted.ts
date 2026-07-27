import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True once the client has hydrated — avoids effect-based setState for this. */
export function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
