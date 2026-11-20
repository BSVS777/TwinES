import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BaselineForm } from "@/components/forms/baseline-form";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function stubFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fill(part: string, mileage: string, date: string) {
  fireEvent.change(screen.getByLabelText("Part"), { target: { value: part } });
  fireEvent.change(screen.getByLabelText("Mileage at last service (km)"), { target: { value: mileage } });
  fireEvent.change(screen.getByLabelText("Date of last service"), { target: { value: date } });
  fireEvent.click(screen.getByRole("button", { name: "Save baseline" }));
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BaselineForm", () => {
  it("offers the 8 catalog parts by name", () => {
    render(<BaselineForm vehicleId="v1" />);

    const options = Array.from(screen.getByLabelText("Part").querySelectorAll("option"));
    expect(options.slice(1).map((option) => option.textContent)).toEqual(MAINTENANCE_CATALOG.map((part) => part.name));
    expect(options.slice(1).map((option) => option.value)).toEqual(MAINTENANCE_CATALOG.map((part) => part.id));
    expect(screen.getByLabelText("Date of last service")).toHaveAttribute("type", "date");
  });

  it("VEH-06 puts the baseline for the chosen part, with the mileage as a number, and confirms it", async () => {
    const fetchMock = stubFetch(Response.json({ baseline: {} }));
    render(<BaselineForm vehicleId="v1" />);

    fill("engine-oil", "42000", "2026-09-01");

    expect(await screen.findByRole("status")).toHaveTextContent("Baseline saved");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/vehicles/v1/baselines",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ partId: "engine-oil", mileageKm: 42000, date: "2026-09-01" }),
      }),
    );
    expect(router.refresh).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("VEH-07 shows the rejection next to the mileage field and does not confirm", async () => {
    const message = "Mileage cannot be higher than the vehicle's current mileage";
    stubFetch(Response.json({ errors: { mileageKm: message } }, { status: 400 }));
    render(<BaselineForm vehicleId="v1" />);

    fill("engine-oil", "46000", "2026-09-01");

    await waitFor(() => expect(screen.getByLabelText("Mileage at last service (km)")).toHaveAccessibleDescription(message));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Date of last service")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("VEH-07 shows a future date rejection next to the date field", async () => {
    stubFetch(Response.json({ errors: { date: "Date cannot be in the future" } }, { status: 400 }));
    render(<BaselineForm vehicleId="v1" />);

    fill("engine-oil", "42000", "2099-01-01");

    await waitFor(() =>
      expect(screen.getByLabelText("Date of last service")).toHaveAccessibleDescription("Date cannot be in the future"),
    );
  });

  it("shows a missing part next to the part field", async () => {
    stubFetch(Response.json({ errors: { partId: "Part is required" } }, { status: 400 }));
    render(<BaselineForm vehicleId="v1" />);

    fill("", "42000", "2026-09-01");

    await waitFor(() => expect(screen.getByLabelText("Part")).toHaveAccessibleDescription("Part is required"));
  });

  it("hides an earlier confirmation when the next save starts, and disables the button while saving", async () => {
    stubFetch(Response.json({ baseline: {} }));
    render(<BaselineForm vehicleId="v1" />);
    fill("engine-oil", "42000", "2026-09-01");
    await screen.findByRole("status");

    let finish: (response: Response) => void = () => {};
    stubFetch(new Promise<Response>((resolve) => (finish = resolve)));
    fireEvent.click(screen.getByRole("button", { name: "Save baseline" }));

    const busy = await screen.findByRole("button", { name: "Saving..." });
    expect(busy).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    finish(Response.json({ baseline: {} }));
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});
