import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VehicleForm, type VehicleFormValues } from "@/components/forms/vehicle-form";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const EXISTING: VehicleFormValues = {
  id: "v1",
  plate: "ABC-123",
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  bodyType: "sedan",
  currentMileageKm: 45000,
  purchaseDate: "2020-03-01",
  monthlyMileageKm: 1200,
};

function stubFetch(response: Response | Promise<Response>) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillRegistration(overrides: Partial<Record<string, string>> = {}) {
  const values: Record<string, string> = {
    Plate: "abc-123",
    Make: "Toyota",
    Model: "Corolla",
    Year: "2020",
    "Body type": "sedan",
    "Current mileage (km)": "45000",
    "Purchase date": "2020-03-01",
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) type(label, value);
}

function submit(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function sentBody(fetchMock: ReturnType<typeof stubFetch>): unknown {
  const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
  return JSON.parse(init.body as string);
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VehicleForm", () => {
  describe("registration", () => {
    it("has a labelled field for every vehicle detail and a body type choice", () => {
      render(<VehicleForm />);

      for (const label of ["Plate", "Make", "Model", "Year", "Current mileage (km)", "Estimated monthly mileage (km)"]) {
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      }
      expect(screen.getByLabelText("Purchase date")).toHaveAttribute("type", "date");
      const options = Array.from(screen.getByLabelText("Body type").querySelectorAll("option")).map((o) => o.value);
      expect(options).toEqual(["", "sedan", "hatchback", "suv", "pickup"]);
    });

    it("VEH-04 tells the owner the monthly mileage is optional and defaults to 1,000 km", () => {
      render(<VehicleForm />);

      expect(screen.getByLabelText("Estimated monthly mileage (km)")).toHaveAccessibleDescription(
        "Defaults to 1,000 km",
      );
    });

    it("VEH-01 posts numbers as numbers, leaves the monthly mileage out when empty, then shows the list", async () => {
      const fetchMock = stubFetch(Response.json({ vehicle: {} }, { status: 201 }));
      render(<VehicleForm />);

      fillRegistration();
      submit("Register vehicle");

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
      expect(router.refresh).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith("/api/vehicles", expect.objectContaining({ method: "POST" }));
      expect(sentBody(fetchMock)).toEqual({
        plate: "abc-123",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        bodyType: "sedan",
        currentMileageKm: 45000,
        purchaseDate: "2020-03-01",
      });
    });

    it("sends the monthly mileage when the owner fills it in", async () => {
      const fetchMock = stubFetch(Response.json({ vehicle: {} }, { status: 201 }));
      render(<VehicleForm />);

      fillRegistration({ "Estimated monthly mileage (km)": "800" });
      submit("Register vehicle");

      await waitFor(() => expect(router.push).toHaveBeenCalled());
      expect(sentBody(fetchMock)).toMatchObject({ monthlyMileageKm: 800 });
    });

    it("lets the server judge text that is not a number instead of guessing", async () => {
      const fetchMock = stubFetch(Response.json({ errors: { year: "Year must be a whole number" } }, { status: 400 }));
      render(<VehicleForm />);

      fillRegistration({ Year: "twenty" });
      submit("Register vehicle");

      await waitFor(() => expect(screen.getByLabelText("Year")).toHaveAccessibleDescription("Year must be a whole number"));
      expect(sentBody(fetchMock)).toMatchObject({ year: "twenty" });
    });

    it("VEH-03 shows each invalid field's own message next to that field", async () => {
      const errors = {
        plate: "Plate must be at most 8 characters",
        year: "Year must be 1990 or later",
        bodyType: "Body type must be sedan, hatchback, suv or pickup",
        currentMileageKm: "Mileage cannot be negative",
        purchaseDate: "Purchase date cannot be in the future",
      };
      stubFetch(Response.json({ errors }, { status: 400 }));
      render(<VehicleForm />);

      fillRegistration();
      submit("Register vehicle");

      const expected: Record<string, string> = {
        Plate: errors.plate,
        Year: errors.year,
        "Body type": errors.bodyType,
        "Current mileage (km)": errors.currentMileageKm,
        "Purchase date": errors.purchaseDate,
      };
      await waitFor(() => expect(screen.getByLabelText("Plate")).toHaveAttribute("aria-invalid", "true"));
      for (const [label, message] of Object.entries(expected)) {
        expect(screen.getByLabelText(label)).toHaveAccessibleDescription(message);
      }
      expect(screen.getByLabelText("Make")).not.toHaveAttribute("aria-invalid", "true");
      expect(router.push).not.toHaveBeenCalled();
    });

    it("VEH-02 shows the duplicate plate message under the plate field", async () => {
      stubFetch(Response.json({ errors: { plate: "This plate is already registered" } }, { status: 409 }));
      render(<VehicleForm />);

      fillRegistration();
      submit("Register vehicle");

      await waitFor(() =>
        expect(screen.getByLabelText("Plate")).toHaveAccessibleDescription("This plate is already registered"),
      );
    });

    it("shows a general failure above the form and keeps what was typed", async () => {
      stubFetch(Response.json({ error: "Authentication required" }, { status: 401 }));
      render(<VehicleForm />);

      fillRegistration();
      submit("Register vehicle");

      expect(await screen.findByRole("alert")).toHaveTextContent("Authentication required");
      expect(screen.getByLabelText("Make")).toHaveValue("Toyota");
    });

    it("disables the button and says so while the request is in flight", async () => {
      let finish: (response: Response) => void = () => {};
      stubFetch(new Promise<Response>((resolve) => (finish = resolve)));
      render(<VehicleForm />);

      fillRegistration();
      submit("Register vehicle");

      const busy = await screen.findByRole("button", { name: "Saving..." });
      expect(busy).toBeDisabled();
      finish(Response.json({ vehicle: {} }, { status: 201 }));
      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
    });
  });

  describe("editing", () => {
    it("prefills every field from the vehicle", () => {
      render(<VehicleForm vehicle={EXISTING} />);

      expect(screen.getByLabelText("Plate")).toHaveValue("ABC-123");
      expect(screen.getByLabelText("Make")).toHaveValue("Toyota");
      expect(screen.getByLabelText("Model")).toHaveValue("Corolla");
      expect(screen.getByLabelText("Year")).toHaveValue("2020");
      expect(screen.getByLabelText("Body type")).toHaveValue("sedan");
      expect(screen.getByLabelText("Current mileage (km)")).toHaveValue("45000");
      expect(screen.getByLabelText("Purchase date")).toHaveValue("2020-03-01");
      expect(screen.getByLabelText("Estimated monthly mileage (km)")).toHaveValue("1200");
      expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    });

    it("patches the vehicle with the edited values and returns to the list", async () => {
      const fetchMock = stubFetch(Response.json({ vehicle: {} }));
      render(<VehicleForm vehicle={EXISTING} />);

      type("Current mileage (km)", "46000");
      submit("Save changes");

      await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
      expect(fetchMock).toHaveBeenCalledWith("/api/vehicles/v1", expect.objectContaining({ method: "PATCH" }));
      expect(sentBody(fetchMock)).toEqual({
        plate: "ABC-123",
        make: "Toyota",
        model: "Corolla",
        year: 2020,
        bodyType: "sedan",
        currentMileageKm: 46000,
        purchaseDate: "2020-03-01",
        monthlyMileageKm: 1200,
      });
    });

    it("VEH-09 shows the odometer rollback message under the mileage field", async () => {
      stubFetch(
        Response.json({ errors: { currentMileageKm: "Mileage cannot be lower than the current value" } }, { status: 400 }),
      );
      render(<VehicleForm vehicle={EXISTING} />);

      type("Current mileage (km)", "44000");
      submit("Save changes");

      await waitFor(() =>
        expect(screen.getByLabelText("Current mileage (km)")).toHaveAccessibleDescription(
          "Mileage cannot be lower than the current value",
        ),
      );
    });
  });
});
