import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleHealthView } from "@/components/vehicle-health/VehicleHealthView";
import type { VehicleVisualProps } from "@/components/vehicle-health/vehicle-visual";
import { useWebGLSupport } from "@/components/vehicle-health/useWebGLSupport";
import { PART_ROWS } from "./fixtures";

vi.mock("@/components/vehicle-health/useWebGLSupport", () => ({ useWebGLSupport: vi.fn() }));

const VEHICLE = { plate: "ABC-123", make: "Toyota", model: "Corolla", year: 2020, currentMileageKm: 45250, bodyType: "pickup" as const };
const NEXT = { date: "2026-12-09", overdue: false, parts: ["engine-oil" as const], estimatedMileageKm: 46800 };

function renderView(props: Partial<Parameters<typeof VehicleHealthView>[0]> = {}) {
  return render(
    <VehicleHealthView vehicle={VEHICLE} overallStatus="orange" nextMaintenance={NEXT} parts={PART_ROWS} canMarkServiced={false} {...props} />,
  );
}

function selectedPanel() {
  return screen.getByRole("region", { name: "Part details" });
}

beforeEach(() => {
  vi.mocked(useWebGLSupport).mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("VehicleHealthView", () => {
  it("VIEW-01 renders the summary with the generic-intervals notice", () => {
    renderView();

    expect(screen.getByRole("heading", { name: "ABC-123" })).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla 2020")).toBeInTheDocument();
    expect(screen.getByText("2026-12-09")).toBeInTheDocument();
    expect(screen.getByText(/generic estimates, not manufacturer data/)).toBeInTheDocument();
  });

  it("VIEW-02 renders all 8 parts in the list", () => {
    renderView();

    expect(within(screen.getByRole("list", { name: "Vehicle parts" })).getAllByRole("listitem")).toHaveLength(8);
  });

  it("VIEW-06 shows the 2D diagram with 8 zones and no errors when WebGL is unavailable", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderView();

    const diagram = screen.getByRole("group", { name: "Vehicle diagram" });
    expect(within(diagram).getAllByRole("button")).toHaveLength(8);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("VIEW-06 uses the 2D diagram while WebGL support is still unknown", () => {
    vi.mocked(useWebGLSupport).mockReturnValue(null);
    renderView();

    expect(screen.getByRole("group", { name: "Vehicle diagram" })).toBeInTheDocument();
  });

  it("uses the 2D diagram when WebGL is available but no 3D component is provided yet", () => {
    vi.mocked(useWebGLSupport).mockReturnValue(true);
    renderView();

    expect(screen.getByRole("group", { name: "Vehicle diagram" })).toBeInTheDocument();
  });

  it("renders the provided 3D component instead of the 2D diagram when WebGL is available", () => {
    vi.mocked(useWebGLSupport).mockReturnValue(true);
    const Vehicle3D = vi.fn(({ bodyType, onSelect }: VehicleVisualProps) => (
      <button type="button" onClick={() => onSelect("coolant")}>
        3D {bodyType}
      </button>
    ));
    renderView({ Vehicle3D });

    expect(screen.queryByRole("group", { name: "Vehicle diagram" })).not.toBeInTheDocument();
    expect(Vehicle3D.mock.calls[0][0]).toMatchObject({ bodyType: "pickup", selectedPartId: null });
    expect(Vehicle3D.mock.calls[0][0].parts).toHaveLength(8);

    fireEvent.click(screen.getByRole("button", { name: "3D pickup" }));

    expect(selectedPanel()).toHaveTextContent("Coolant");
  });

  it("shows the 2D diagram instead of the 3D component when WebGL is unavailable", () => {
    const Vehicle3D = vi.fn(() => <p>3D model</p>);
    renderView({ Vehicle3D });

    expect(screen.queryByText("3D model")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Vehicle diagram" })).toBeInTheDocument();
  });

  it("starts with no part selected", () => {
    renderView();

    expect(selectedPanel()).toHaveTextContent("Select a part to see its details.");
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("VIEW-05 keeps the list, the panel and the diagram zone in sync when selecting from the list", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Brake pads" }));
    expect(selectedPanel()).toHaveTextContent("Brake pads");
    expect(screen.getByRole("button", { name: "Brake pads: Green" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));
    expect(selectedPanel()).toHaveTextContent("Engine oil");
    expect(selectedPanel()).toHaveTextContent("Red");
    expect(screen.getByRole("button", { name: "Engine oil: Red" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Brake pads: Green" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Engine oil" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Brake pads" })).toHaveAttribute("aria-pressed", "false");
  });

  it("VIEW-05 keeps everything in sync when selecting from the diagram", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Battery: Yellow" }));

    expect(selectedPanel()).toHaveTextContent("Battery");
    expect(selectedPanel()).toHaveTextContent("Time-based");
    expect(screen.getByRole("button", { name: "Battery" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
  });

  it("VIEW-08 offers Mark as serviced to a technician and reports the selected part", () => {
    const onMarkServiced = vi.fn();
    renderView({ canMarkServiced: true, onMarkServiced });

    fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark as serviced" }));

    expect(onMarkServiced).toHaveBeenCalledExactlyOnceWith("engine-oil");
  });

  it("VIEW-09 never shows Mark as serviced to an owner", () => {
    renderView({ canMarkServiced: false });

    fireEvent.click(screen.getByRole("button", { name: "Engine oil" }));

    expect(screen.queryByRole("button", { name: "Mark as serviced" })).not.toBeInTheDocument();
  });
});
