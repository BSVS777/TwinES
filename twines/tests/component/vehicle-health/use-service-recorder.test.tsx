import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useServiceRecorder } from "@/components/vehicle-health/use-service-recorder";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  router.refresh.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useServiceRecorder", () => {
  it("VEH-16 posts the part and mileage to the vehicle's service endpoint, refreshes and reports no error", async () => {
    const fetchMock = stubFetch(Response.json({ vehicle: {} }));
    const { result } = renderHook(() => useServiceRecorder("vehicle-9"));

    const message = await result.current("engine-oil", 45200);

    expect(message).toBeNull();
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      "/api/technician/vehicles/vehicle-9/service",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ partId: "engine-oil", currentMileageKm: 45200 }) }),
    );
  });

  it("leaves the mileage out of the payload when none is given", async () => {
    const fetchMock = stubFetch(Response.json({ vehicle: {} }));
    const { result } = renderHook(() => useServiceRecorder("vehicle-9"));

    await result.current("tires", undefined);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify({ partId: "tires" }) }),
    );
  });

  it("encodes the vehicle id in the path", async () => {
    const fetchMock = stubFetch(Response.json({}));
    const { result } = renderHook(() => useServiceRecorder("a/b c"));

    await result.current("tires");

    expect(fetchMock).toHaveBeenCalledWith("/api/technician/vehicles/a%2Fb%20c/service", expect.anything());
  });

  it("VEH-09 returns the field message of a 400 and does not refresh", async () => {
    stubFetch(Response.json({ errors: { currentMileageKm: "Mileage cannot be lower than the current value" } }, { status: 400 }));
    const { result } = renderHook(() => useServiceRecorder("vehicle-9"));

    const message = await result.current("engine-oil", 100);

    expect(message).toBe("Mileage cannot be lower than the current value");
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("returns the message of a 403", async () => {
    stubFetch(Response.json({ error: "Only technicians can record a service" }, { status: 403 }));
    const { result } = renderHook(() => useServiceRecorder("vehicle-9"));

    expect(await result.current("engine-oil")).toBe("Only technicians can record a service");
  });

  it("returns a generic message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { result } = renderHook(() => useServiceRecorder("vehicle-9"));

    expect(await result.current("engine-oil")).toBe("Something went wrong. Please try again.");
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
