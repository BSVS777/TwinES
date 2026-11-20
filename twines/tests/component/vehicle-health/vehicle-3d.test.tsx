import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Vehicle3D } from "@/components/vehicle-health/Vehicle3D";
import type { PartId } from "@/domain/part-health/catalog";
import type { BodyType } from "@/application/ports";
import { PART_ROWS } from "./fixtures";
import { stubMatchMedia } from "./match-media";

// jsdom has no WebGL, so the canvas, its HTML anchors and the camera controls are replaced by
// plain elements that expose what Vehicle3D hands them. The meshes live in VehicleScene.
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
}));

vi.mock("@react-three/drei", () => ({
  Html: ({ children, portal }: { children: React.ReactNode; portal?: { current: HTMLElement | null } }) => (
    <div data-testid="hotspot-anchor" data-portal={portal?.current?.getAttribute("aria-label") ?? "none"}>
      {children}
    </div>
  ),
  OrbitControls: ({ autoRotate, autoRotateSpeed }: { autoRotate?: boolean; autoRotateSpeed?: number }) => (
    <div data-testid="orbit-controls" data-auto-rotate={String(autoRotate)} data-speed={autoRotateSpeed} />
  ),
}));

vi.mock("@/components/vehicle-health/VehicleScene", () => ({
  VehicleScene: ({ model, selectedPartId }: { model: { bodyType: string }; selectedPartId: string | null }) => (
    <div data-testid="vehicle-scene" data-body-type={model.bodyType} data-selected={selectedPartId ?? ""} />
  ),
}));

const LABELS = [
  "Engine oil: Red",
  "Oil filter: Orange",
  "Air filter: Yellow",
  "Brake pads: Green",
  "Tires: Green",
  "Battery: Yellow",
  "Coolant: Green",
  "Spark plugs: Green",
];

function renderModel(selectedPartId: PartId | null = null, bodyType: BodyType = "sedan") {
  const onSelect = vi.fn();
  const view = render(<Vehicle3D bodyType={bodyType} parts={PART_ROWS} selectedPartId={selectedPartId} onSelect={onSelect} />);
  return { onSelect, ...view };
}

function autoRotate(): string | null {
  return screen.getByTestId("orbit-controls").getAttribute("data-auto-rotate");
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Vehicle3D", () => {
  it.each(["sedan", "hatchback", "suv", "pickup"] as const)("VIEW-03 shows the %s model for that body type", (bodyType) => {
    renderModel(null, bodyType);

    expect(screen.getByTestId("vehicle-scene")).toHaveAttribute("data-body-type", bodyType);
  });

  it("VIEW-04 renders one real button per part, named with the part and its status text", () => {
    renderModel();

    const buttons = within(screen.getByRole("group", { name: "Vehicle 3D model" })).getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(LABELS);
    for (const button of buttons) expect(button).toHaveAttribute("type", "button");
  });

  it("appends every hotspot button to the model's own element, so none loses its content on hand-over", () => {
    renderModel();

    const anchors = screen.getAllByTestId("hotspot-anchor");
    expect(anchors).toHaveLength(8);
    for (const anchor of anchors) expect(anchor).toHaveAttribute("data-portal", "Vehicle 3D model");
  });

  it("starts with no part pressed", () => {
    renderModel();

    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });

  it("VIEW-04 reports the part when its button is clicked", () => {
    const { onSelect } = renderModel();

    fireEvent.click(screen.getByRole("button", { name: "Brake pads: Green" }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("brake-pads");
  });

  it("VIEW-05 marks only the selected part as pressed and highlights it in the scene", () => {
    renderModel("engine-oil");

    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Engine oil: Red" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Brake pads: Green" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("vehicle-scene")).toHaveAttribute("data-selected", "engine-oil");
  });

  it("VIEW-04 rotates slowly while nothing is selected and pauses once a part is selected", () => {
    const { rerender, onSelect } = renderModel(null);
    expect(autoRotate()).toBe("true");
    expect(Number(screen.getByTestId("orbit-controls").getAttribute("data-speed"))).toBeLessThanOrEqual(1);

    rerender(<Vehicle3D bodyType="sedan" parts={PART_ROWS} selectedPartId="brake-pads" onSelect={onSelect} />);

    expect(autoRotate()).toBe("false");
  });

  it("VIEW-07 does not auto-rotate when the system prefers reduced motion", () => {
    stubMatchMedia(true);

    renderModel(null);

    expect(autoRotate()).toBe("false");
    expect(screen.getByTestId("vehicle-scene")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });

  it("VIEW-07 stops rotating if the preference turns on while the page is open", () => {
    const media = stubMatchMedia(false);
    renderModel(null);
    expect(autoRotate()).toBe("true");

    act(() => media.change(true));

    expect(autoRotate()).toBe("false");
  });
});
