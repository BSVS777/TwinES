import { cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetModules();
});

function stubContext(result: () => unknown) {
  return vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(result as never);
}

describe("detectWebGL", () => {
  it("VIEW-06 is true when a WebGL context can be created", async () => {
    stubContext(() => ({}));
    const { detectWebGL } = await import("@/components/vehicle-health/useWebGLSupport");

    expect(detectWebGL()).toBe(true);
  });

  it("VIEW-06 is false when the browser gives no WebGL context", async () => {
    stubContext(() => null);
    const { detectWebGL } = await import("@/components/vehicle-health/useWebGLSupport");

    expect(detectWebGL()).toBe(false);
  });

  it("VIEW-06 is false, not an error, when creating the context throws", async () => {
    stubContext(() => {
      throw new Error("WebGL is disabled");
    });
    const { detectWebGL } = await import("@/components/vehicle-health/useWebGLSupport");

    expect(detectWebGL()).toBe(false);
  });
});

describe("useWebGLSupport", () => {
  it("is unknown (null) while rendering on the server", async () => {
    const { useWebGLSupport } = await import("@/components/vehicle-health/useWebGLSupport");
    function Probe() {
      return <span>{String(useWebGLSupport())}</span>;
    }

    expect(renderToString(<Probe />)).toContain("null");
  });

  it("VIEW-06 reports true in a browser with WebGL", async () => {
    stubContext(() => ({}));
    const { useWebGLSupport } = await import("@/components/vehicle-health/useWebGLSupport");

    expect(renderHook(() => useWebGLSupport()).result.current).toBe(true);
  });

  it("VIEW-06 reports false in a browser without WebGL and probes only once", async () => {
    const getContext = stubContext(() => null);
    const { useWebGLSupport } = await import("@/components/vehicle-health/useWebGLSupport");

    const { result, rerender } = renderHook(() => useWebGLSupport());
    rerender();

    expect(result.current).toBe(false);
    expect(getContext.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
