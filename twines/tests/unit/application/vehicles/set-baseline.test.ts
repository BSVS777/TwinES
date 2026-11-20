import { beforeEach, describe, expect, it } from "vitest";
import { Forbidden, NotFound, ValidationError } from "@/application/errors";
import type { Vehicle } from "@/application/ports";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { setBaseline, type SetBaselineDeps } from "@/application/vehicles/set-baseline";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, OWNER_B, REGISTRATION, TECHNICIAN } from "./fakes";

describe("setBaseline", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: SetBaselineDeps;
  let vehicle: Vehicle;

  const BASELINE = { partId: "engine-oil", mileageKm: 42000, date: "2026-02-01" };

  function stored(partId: string) {
    return vehicles.vehicles[0].baselines.find((baseline) => baseline.partId === partId);
  }

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles, clock: new FakeClock() };
    vehicle = await registerVehicle(deps, OWNER_A, REGISTRATION);
  });

  it("VEH-06 saves the owner's baseline for that part and returns it", async () => {
    const saved = await setBaseline(deps, OWNER_A, vehicle.id, BASELINE);

    expect(saved).toEqual(BASELINE);
    expect(stored("engine-oil")).toEqual(BASELINE);
  });

  it("replaces the part's baseline without touching the other 7", async () => {
    await setBaseline(deps, OWNER_A, vehicle.id, BASELINE);

    expect(vehicles.vehicles[0].baselines).toHaveLength(8);
    expect(stored("oil-filter")).toMatchObject({ mileageKm: 0, date: "2020-03-01" });
  });

  describe("VEH-07 invalid baselines", () => {
    it("rejects a mileage above the vehicle's current mileage and saves nothing", async () => {
      const error = await setBaseline(deps, OWNER_A, vehicle.id, { ...BASELINE, mileageKm: 46000 }).catch((e) => e);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({ mileageKm: "Mileage cannot be higher than the vehicle's current mileage" });
      expect(stored("engine-oil")).toMatchObject({ mileageKm: 0 });
    });

    it("accepts a mileage equal to the current mileage but not one kilometre more", async () => {
      await expect(setBaseline(deps, OWNER_A, vehicle.id, { ...BASELINE, mileageKm: 45000 })).resolves.toBeDefined();
      await expect(setBaseline(deps, OWNER_A, vehicle.id, { ...BASELINE, mileageKm: 45001 })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it("rejects a date after today and accepts today, using the clock's date", async () => {
      await expect(setBaseline(deps, OWNER_A, vehicle.id, { ...BASELINE, date: "2026-03-11" })).rejects.toMatchObject({
        errors: { date: "Date cannot be in the future" },
      });
      await expect(setBaseline(deps, OWNER_A, vehicle.id, { ...BASELINE, date: "2026-03-10" })).resolves.toBeDefined();
    });

    it("reports every invalid field at once", async () => {
      const error = await setBaseline(deps, OWNER_A, vehicle.id, { partId: "wipers", mileageKm: -1, date: "nope" }).catch(
        (e) => e,
      );

      expect(Object.keys(error.errors).sort()).toEqual(["date", "mileageKm", "partId"]);
    });
  });

  it("VEH-13 answers NotFound for another owner's vehicle and saves nothing", async () => {
    await expect(setBaseline(deps, OWNER_B, vehicle.id, BASELINE)).rejects.toBeInstanceOf(NotFound);
    await expect(setBaseline(deps, OWNER_A, "no-such-vehicle", BASELINE)).rejects.toBeInstanceOf(NotFound);
    expect(stored("engine-oil")).toMatchObject({ mileageKm: 0 });
  });

  it("checks ownership before validating, so invalid input cannot probe for existence", async () => {
    await expect(setBaseline(deps, OWNER_B, vehicle.id, { partId: "wipers" })).rejects.toBeInstanceOf(NotFound);
  });

  it("refuses a technician with Forbidden: baselines are the owner's to set", async () => {
    await expect(setBaseline(deps, TECHNICIAN, vehicle.id, BASELINE)).rejects.toBeInstanceOf(Forbidden);
    expect(stored("engine-oil")).toMatchObject({ mileageKm: 0 });
  });
});
