import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VehicleDiagram2D } from "@/components/vehicle-health/VehicleDiagram2D";
import type { PartId } from "@/domain/part-health/catalog";
import { PART_ROWS } from "./fixtures";

afterEach(cleanup);

function renderDiagram(selectedPartId: PartId | null = null) {
  const onSelect = vi.fn();
  render(<VehicleDiagram2D parts={PART_ROWS} selectedPartId={selectedPartId} onSelect={onSelect} />);
  return { onSelect };
}

describe("VehicleDiagram2D", () => {
  it("VIEW-06 shows 8 focusable zones named with the part and its status text", () => {
    renderDiagram();

    const zones = screen.getAllByRole("button");
    expect(zones).toHaveLength(8);
    expect(zones.map((zone) => zone.getAttribute("aria-label"))).toEqual([
      "Engine oil: Red",
      "Oil filter: Orange",
      "Air filter: Yellow",
      "Brake pads: Green",
      "Tires: Green",
      "Battery: Yellow",
      "Coolant: Green",
      "Spark plugs: Green",
    ]);
    zones.forEach((zone) => expect(zone).toHaveAttribute("tabindex", "0"));
  });

  it("VIEW-06 colors each zone by the status of its part", () => {
    renderDiagram();

    PART_ROWS.forEach((part) => {
      const zone = screen.getByRole("button", { name: `${part.name}: ${part.status[0].toUpperCase()}${part.status.slice(1)}` });
      expect(zone).toHaveAttribute("data-status", part.status);
    });
  });

  it("VIEW-06 is an image-like group with an accessible name", () => {
    renderDiagram();

    expect(screen.getByRole("group", { name: "Vehicle diagram" })).toBeInTheDocument();
  });

  it("VIEW-05 selects a part when its zone is clicked", () => {
    const { onSelect } = renderDiagram();

    fireEvent.click(screen.getByRole("button", { name: "Brake pads: Green" }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("brake-pads");
  });

  it("VIEW-05 selects a part from the keyboard with Enter and Space only", () => {
    const { onSelect } = renderDiagram();
    const zone = screen.getByRole("button", { name: "Engine oil: Red" });

    fireEvent.keyDown(zone, { key: "Enter" });
    fireEvent.keyDown(zone, { key: " " });
    fireEvent.keyDown(zone, { key: "a" });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenNthCalledWith(1, "engine-oil");
    expect(onSelect).toHaveBeenNthCalledWith(2, "engine-oil");
  });

  it("VIEW-05 highlights only the selected zone", () => {
    renderDiagram("engine-oil");

    expect(screen.getByRole("button", { name: "Engine oil: Red" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(1);
  });
});
