import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PartDetailPanel } from "@/components/vehicle-health/PartDetailPanel";
import { PART_ROWS } from "./fixtures";

afterEach(cleanup);

const ENGINE_OIL = PART_ROWS[0];
const OIL_FILTER = PART_ROWS[1];
const BATTERY = PART_ROWS[5];

describe("PartDetailPanel", () => {
  it("VIEW-04 shows the selected part's status, usage, remaining km and days and due date", () => {
    render(<PartDetailPanel part={OIL_FILTER} canMarkServiced={false} />);

    const panel = screen.getByRole("region", { name: "Part details" });
    expect(panel).toHaveTextContent("Oil filter");
    expect(panel).toHaveTextContent("Orange");
    expect(panel).toHaveTextContent("80%");
    expect(panel).toHaveTextContent("1,000 km left");
    expect(panel).toHaveTextContent("36 days left");
    expect(panel).toHaveTextContent("2026-12-26");
    expect(panel).not.toHaveTextContent(/overdue/i);
  });

  it("VIEW-04 shows overdue explicitly and Time-based for a time-only part", () => {
    const { rerender } = render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced={false} />);
    expect(screen.getByRole("region", { name: "Part details" })).toHaveTextContent("600 km overdue");
    expect(screen.getByText("Overdue")).toBeInTheDocument();

    rerender(<PartDetailPanel part={BATTERY} canMarkServiced={false} />);
    expect(screen.getByRole("region", { name: "Part details" })).toHaveTextContent("Time-based");
  });

  it("asks the user to select a part while none is selected", () => {
    render(<PartDetailPanel part={null} canMarkServiced />);

    expect(screen.getByText("Select a part to see its details.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as serviced" })).not.toBeInTheDocument();
  });

  it("VIEW-08 offers Mark as serviced to a technician and reports the selected part", () => {
    const onMarkServiced = vi.fn();
    render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced onMarkServiced={onMarkServiced} />);

    fireEvent.click(screen.getByRole("button", { name: "Mark as serviced" }));

    expect(onMarkServiced).toHaveBeenCalledExactlyOnceWith("engine-oil");
  });

  it("VIEW-08 still shows the action when no callback is wired yet", () => {
    render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced />);

    expect(screen.getByRole("button", { name: "Mark as serviced" })).toBeInTheDocument();
    expect(() => fireEvent.click(screen.getByRole("button", { name: "Mark as serviced" }))).not.toThrow();
  });

  it("VIEW-09 never shows Mark as serviced to an owner, even when a callback is given", () => {
    render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced={false} onMarkServiced={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Mark as serviced" })).not.toBeInTheDocument();
    expect(screen.queryByText(/mark as serviced/i)).not.toBeInTheDocument();
  });
});
