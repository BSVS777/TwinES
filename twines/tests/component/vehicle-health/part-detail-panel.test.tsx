import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  describe("VIEW-08 service action", () => {
    const open = () => fireEvent.click(screen.getByRole("button", { name: "Mark as serviced" }));
    const confirm = () => fireEvent.click(screen.getByRole("button", { name: "Confirm service" }));

    it("offers Mark as serviced to a technician without any form until it is used", () => {
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Mark as serviced" })).toBeInTheDocument();
      expect(screen.queryByLabelText("Current mileage (km)")).not.toBeInTheDocument();
    });

    it("shows an optional mileage field prefilled with the vehicle's mileage when the action is used", () => {
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={vi.fn()} />);

      open();

      expect(screen.getByLabelText("Current mileage (km)")).toHaveValue(45250);
      expect(screen.getByRole("button", { name: "Confirm service" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "Mark as serviced" })).not.toBeInTheDocument();
    });

    it("VEH-16 reports the selected part and the typed mileage", async () => {
      const onMarkServiced = vi.fn().mockResolvedValue(null);
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();

      fireEvent.change(screen.getByLabelText("Current mileage (km)"), { target: { value: "45400" } });
      confirm();

      await waitFor(() => expect(onMarkServiced).toHaveBeenCalledExactlyOnceWith("engine-oil", 45400));
    });

    it("sends the prefilled mileage as it is when it is not edited", async () => {
      const onMarkServiced = vi.fn().mockResolvedValue(null);
      render(<PartDetailPanel part={OIL_FILTER} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();

      confirm();

      await waitFor(() => expect(onMarkServiced).toHaveBeenCalledExactlyOnceWith("oil-filter", 45250));
    });

    it("sends no mileage when the field is emptied", async () => {
      const onMarkServiced = vi.fn().mockResolvedValue(null);
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();

      fireEvent.change(screen.getByLabelText("Current mileage (km)"), { target: { value: "" } });
      confirm();

      await waitFor(() => expect(onMarkServiced).toHaveBeenCalledExactlyOnceWith("engine-oil", undefined));
    });

    it("leaves the field empty and sends no mileage when the vehicle's mileage is not given", async () => {
      const onMarkServiced = vi.fn().mockResolvedValue(null);
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced onMarkServiced={onMarkServiced} />);
      open();

      expect(screen.getByLabelText("Current mileage (km)")).toHaveValue(null);
      confirm();

      await waitFor(() => expect(onMarkServiced).toHaveBeenCalledExactlyOnceWith("engine-oil", undefined));
    });

    it("disables the form while the request is in flight, then closes it and confirms", async () => {
      let finish: (message: string | null) => void = () => undefined;
      const onMarkServiced = vi.fn(() => new Promise<string | null>((resolve) => (finish = resolve)));
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();

      confirm();

      const saving = await screen.findByRole("button", { name: "Saving..." });
      expect(saving).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
      expect(screen.getByLabelText("Current mileage (km)")).toBeDisabled();
      fireEvent.click(saving);
      expect(onMarkServiced).toHaveBeenCalledTimes(1);

      finish(null);
      expect(await screen.findByRole("status")).toHaveTextContent("Service recorded");
      expect(screen.queryByLabelText("Current mileage (km)")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mark as serviced" })).toBeEnabled();
    });

    it("VEH-09 shows the error message, keeps the form open with the typed value and allows retrying", async () => {
      const onMarkServiced = vi.fn().mockResolvedValue("Mileage cannot be lower than the current value");
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();

      fireEvent.change(screen.getByLabelText("Current mileage (km)"), { target: { value: "100" } });
      confirm();

      expect(await screen.findByRole("alert")).toHaveTextContent("Mileage cannot be lower than the current value");
      expect(screen.getByLabelText("Current mileage (km)")).toHaveValue(100);
      expect(screen.getByRole("button", { name: "Confirm service" })).toBeEnabled();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("clears an earlier error when the request is sent again", async () => {
      const onMarkServiced = vi.fn().mockResolvedValueOnce("Something went wrong. Please try again.").mockResolvedValueOnce(null);
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();
      confirm();
      await screen.findByRole("alert");

      confirm();

      expect(await screen.findByRole("status")).toHaveTextContent("Service recorded");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("cancel closes the form without sending anything", () => {
      const onMarkServiced = vi.fn();
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={onMarkServiced} />);
      open();

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onMarkServiced).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Mark as serviced" })).toBeInTheDocument();
    });

    it("starts closed again when another part is selected", () => {
      const { rerender } = render(
        <PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} onMarkServiced={vi.fn()} />,
      );
      open();

      rerender(<PartDetailPanel part={OIL_FILTER} canMarkServiced currentMileageKm={45250} onMarkServiced={vi.fn()} />);

      expect(screen.queryByLabelText("Current mileage (km)")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mark as serviced" })).toBeInTheDocument();
    });

    it("still shows the action when no callback is wired, and confirming does nothing harmful", async () => {
      render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced currentMileageKm={45250} />);
      open();

      expect(() => confirm()).not.toThrow();
      expect(await screen.findByRole("status")).toHaveTextContent("Service recorded");
    });
  });

  it("VIEW-09 never shows Mark as serviced to an owner, even when a callback is given", () => {
    render(<PartDetailPanel part={ENGINE_OIL} canMarkServiced={false} onMarkServiced={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Mark as serviced" })).not.toBeInTheDocument();
    expect(screen.queryByText(/mark as serviced/i)).not.toBeInTheDocument();
  });
});
