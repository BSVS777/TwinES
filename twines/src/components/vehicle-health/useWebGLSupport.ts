import { useSyncExternalStore } from "react";

/** True when the browser can create a WebGL context. Never throws: a failure means no support. */
export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Probing creates a GL context, so it happens once per page load.
let cached: boolean | undefined;

function getSnapshot(): boolean {
  cached ??= detectWebGL();
  return cached;
}

// Support never changes while the page is open, so there is nothing to subscribe to.
function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): null {
  return null;
}

/**
 * Whether WebGL is available: null while unknown (on the server and during hydration), then true
 * or false. Callers must render the 2D fallback for anything other than true.
 */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
}
