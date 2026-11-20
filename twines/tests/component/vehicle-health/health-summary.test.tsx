import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HealthSummary } from "@/components/vehicle-health/HealthSummary";

afterEach(cleanup);

const VEHICLE = { plate: "ABC-123", make: "Toyota", model: "Corolla", year: 2020, currentMileageKm: 45250 };

describe("HealthSummary", () => {
  it("VIEW-01 shows the vehicle details, overall status, next maintenance and the generic-intervals notice", () => {
    render(
      <HealthSummary
        vehicle={VEHICLE}
        overallStatus="orange"
        nextMaintenance={{ date: "2026-12-09", overdue: false, parts: ["engine-oil", "oil-filter"], estimatedMileageKm: 46800 }}
      />,
    );

    expect(screen.getByText("ABC-123")).toBeInTheDocument();
    expect(screen.getByText("Toyota Corolla 2020")).toBeInTheDocument();
    expect(screen.getByText("45,250 km")).toBeInTheDocument();
    expect(screen.getByText("Orange")).toBeInTheDocument();
    expect(screen.getByText("2026-12-09")).toBeInTheDocument();
    expect(screen.getByText("46,800 km")).toBeInTheDocument();
    expect(screen.getByText("Engine oil, Oil filter")).toBeInTheDocument();
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    expect(screen.getByText("Maintenance intervals are generic estimates, not manufacturer data.")).toBeInTheDocument();
  });

  it("VIEW-01 flags overdue next maintenance explicitly", () => {
    render(
      <HealthSummary
        vehicle={VEHICLE}
        overallStatus="red"
        nextMaintenance={{ date: "2026-11-20", overdue: true, parts: ["brake-pads"], estimatedMileageKm: 45250 }}
      />,
    );

    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Brake pads")).toBeInTheDocument();
  });
});
