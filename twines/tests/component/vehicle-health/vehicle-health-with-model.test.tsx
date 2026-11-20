import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleHealthWithModel } from "@/components/vehicle-health/VehicleHealthWithModel";
import { useWebGLSupport } from "@/components/vehicle-health/useWebGLSupport";
import { PART_ROWS } from "./fixtures";
import { stubMatchMedia } from "./match-media";

vi.mock("@/components/vehicle-health/useWebGLSupport", () => ({ useWebGLSupport: vi.fn() }));

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

// Only the WebGL parts are replaced; Vehicle3D, the dynamic loading and the view are the real ones.
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
}));
vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  OrbitControls: ({ autoRotate }: { autoRotate?: boolean }) => <div data-testid="orbit-controls" data-auto-rotate={String(autoRotate)} />,
}));
vi.mock("@/components/vehicle-health/VehicleScene", () => ({
  VehicleScene: ({ model }: { model: { bodyType: string } }) => <div data-testid="vehicle-scene" data-body-type={model.bodyType} />,
}));

const VEHICLE = { plate: "ABC-123", make: "Toyota", model: "Hilux", year: 2020, currentMileageKm: 45250, bodyType: "pickup" as const };
const NEXT = { date: "2026-12-09", overdue: false, parts: ["engine-oil" as const], estimatedMileageKm: 46800 };

function renderPage() {
  return render(<VehicleHealthWithModel vehicle={VEHICLE} overallStatus="orange" nextMaintenance={NEXT} parts={PART_ROWS} canMarkServiced={false} />);
}

function panel() {
  return screen.getByRole("region", { name: "Part details" });
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("VehicleHealthWithModel", () => {
  it("VIEW-03 shows the model for the vehicle's body type when WebGL is available", async () => {
    vi.mocked(useWebGLSupport).mockReturnValue(true);
    renderPage();

    expect(await screen.findByTestId("vehicle-scene")).toHaveAttribute("data-body-type", "pickup");
    expect(screen.queryByRole("group", { name: "Vehicle diagram" })).not.toBeInTheDocument();
  });

  it("VIEW-06 shows the 2D diagram and never loads the model when WebGL is unavailable", () => {
    vi.mocked(useWebGLSupport).mockReturnValue(false);
    renderPage();

    expect(screen.getByRole("group", { name: "Vehicle diagram" })).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });

  it("VIEW-04 clicking a model hotspot opens the part's panel and pauses the rotation", async () => {
    vi.mocked(useWebGLSupport).mockReturnValue(true);
    renderPage();
    await screen.findByTestId("vehicle-scene");
    expect(screen.getByTestId("orbit-controls")).toHaveAttribute("data-auto-rotate", "true");

    fireEvent.click(screen.getByRole("button", { name: "Brake pads: Green" }));

    expect(panel()).toHaveTextContent("Brake pads");
    expect(panel()).toHaveTextContent("Green");
    expect(panel()).toHaveTextContent("20%");
    expect(panel()).toHaveTextContent("24,000 km left");
    expect(panel()).toHaveTextContent("580 days left");
    expect(panel()).toHaveTextContent("2028-06-22");
    expect(screen.getByTestId("orbit-controls")).toHaveAttribute("data-auto-rotate", "false");
  });

  it("VIEW-05 selecting a part in the list updates the panel and highlights its hotspot", async () => {
    vi.mocked(useWebGLSupport).mockReturnValue(true);
    renderPage();
    await screen.findByTestId("vehicle-scene");
    fireEvent.click(screen.getByRole("button", { name: "Brake pads: Green" }));

    fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));

    expect(panel()).toHaveTextContent("Engine oil");
    expect(screen.getByRole("button", { name: "Engine oil: Red" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Brake pads: Green" })).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(screen.getByTestId("orbit-controls")).toHaveAttribute("data-auto-rotate", "false"));
  });

  describe("service action wiring", () => {
    function renderTechnicianPage() {
      return render(
        <VehicleHealthWithModel
          vehicle={VEHICLE}
          overallStatus="orange"
          nextMaintenance={NEXT}
          parts={PART_ROWS}
          canMarkServiced
          serviceVehicleId="vehicle-9"
        />,
      );
    }

    it("VEH-16 posts the service to the vehicle's endpoint and refreshes the page data", async () => {
      vi.mocked(useWebGLSupport).mockReturnValue(false);
      router.refresh.mockReset();
      const fetchMock = vi.fn(async () => Response.json({ vehicle: {} }));
      vi.stubGlobal("fetch", fetchMock);
      renderTechnicianPage();

      fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));
      fireEvent.click(screen.getByRole("button", { name: "Mark as serviced" }));
      fireEvent.change(screen.getByLabelText("Current mileage (km)"), { target: { value: "45300" } });
      fireEvent.click(screen.getByRole("button", { name: "Confirm service" }));

      expect(await screen.findByRole("status")).toHaveTextContent("Service recorded");
      expect(router.refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        "/api/technician/vehicles/vehicle-9/service",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ partId: "engine-oil", currentMileageKm: 45300 }) }),
      );
    });

    it("VEH-09 shows the server's message and does not refresh when the service is refused", async () => {
      vi.mocked(useWebGLSupport).mockReturnValue(false);
      router.refresh.mockReset();
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ errors: { currentMileageKm: "Mileage cannot be lower than the current value" } }, { status: 400 }),
        ),
      );
      renderTechnicianPage();

      fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));
      fireEvent.click(screen.getByRole("button", { name: "Mark as serviced" }));
      fireEvent.click(screen.getByRole("button", { name: "Confirm service" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Mileage cannot be lower than the current value");
      expect(router.refresh).not.toHaveBeenCalled();
    });

    it("VIEW-09 offers no action without a service vehicle", () => {
      vi.mocked(useWebGLSupport).mockReturnValue(false);
      renderPage();

      fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));

      expect(screen.queryByRole("button", { name: "Mark as serviced" })).not.toBeInTheDocument();
    });
  });

  it("VIEW-07 renders the model without auto-rotation when reduced motion is preferred", async () => {
    stubMatchMedia(true);
    vi.mocked(useWebGLSupport).mockReturnValue(true);
    renderPage();

    await screen.findByTestId("vehicle-scene");

    expect(screen.getByTestId("orbit-controls")).toHaveAttribute("data-auto-rotate", "false");
  });
});
