import { vi } from "vitest";

/**
 * jsdom has no matchMedia. Installs a fake whose `matches` can be changed afterwards, notifying
 * subscribers like a real MediaQueryList. Undo with `vi.unstubAllGlobals()`.
 */
export function stubMatchMedia(initialMatches: boolean) {
  const listeners = new Set<() => void>();
  const queries: string[] = [];
  const list = {
    matches: initialMatches,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      queries.push(query);
      return list;
    }),
  );
  return {
    queries,
    listenerCount: () => listeners.size,
    change(matches: boolean) {
      list.matches = matches;
      listeners.forEach((listener) => listener());
    },
  };
}
