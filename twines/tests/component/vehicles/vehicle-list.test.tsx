import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VehicleList, type VehicleListItem } from "@/components/vehicles/vehicle-list";

const VEHICLES: VehicleListItem[] = [
  { id: "v1", plate: "ABC-123", make: "Toyota", model: "Corolla", year: 2020, currentMileageKm: 45000 },
  { id: "v2", plate: "XYZ-789", make: "Mazda", model: "CX-5", year: 2022, currentMileageKm: 1200 },
];

afterEach(cleanup);

describe("VehicleList", () => {
  it("VEH-08 shows each vehicle's plate, make, model, year and mileage", () => {
    render(<VehicleList vehicles={VEHICLES} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText("ABC-123")).toBeInTheDocument();
    expect(items[0]).toHaveTextContent("Toyota Corolla 2020");
    expect(items[0]).toHaveTextContent("45,000 km");
    expect(items[1]).toHaveTextContent("Mazda CX-5 2022");
    expect(items[1]).toHaveTextContent("1,200 km");
  });

  it("links each vehicle to its own page and to its edit page", () => {
    render(<VehicleList vehicles={VEHICLES} />);

    expect(screen.getByRole("link", { name: /^ABC-123/ })).toHaveAttribute("href", "/vehicles/v1");
    expect(screen.getByRole("link", { name: "Edit ABC-123" })).toHaveAttribute("href", "/vehicles/v1/edit");
    expect(screen.getByRole("link", { name: /^XYZ-789/ })).toHaveAttribute("href", "/vehicles/v2");
  });

  it("VEH-11 shows the empty state with a Register vehicle action when there are no vehicles", () => {
    render(<VehicleList vehicles={[]} />);

    expect(screen.getByText("You have no vehicles yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register vehicle" })).toHaveAttribute("href", "/vehicles/new");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
