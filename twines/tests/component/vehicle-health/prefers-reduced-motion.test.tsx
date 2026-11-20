import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "@/components/vehicle-health/usePrefersReducedMotion";
import { stubMatchMedia } from "./match-media";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("usePrefersReducedMotion", () => {
  it("VIEW-07 is true when the system prefers reduced motion", () => {
    const media = stubMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
    expect(media.queries).toContain("(prefers-reduced-motion: reduce)");
  });

  it("is false when the system has no motion preference", () => {
    stubMatchMedia(false);

    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });

  it("follows the preference when it changes while the page is open", () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());

    act(() => media.change(true));
    expect(result.current).toBe(true);

    act(() => media.change(false));
    expect(result.current).toBe(false);
  });

  it("stops listening when unmounted", () => {
    const media = stubMatchMedia(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listenerCount()).toBe(1);

    unmount();

    expect(media.listenerCount()).toBe(0);
  });

  it("is false when the browser cannot report the preference", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });
});
