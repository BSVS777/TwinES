import { beforeEach, describe, expect, it } from "vitest";
import { Forbidden, NotFound, ValidationError } from "@/application/errors";
import type { Vehicle } from "@/application/ports";
import { recordService, type RecordServiceDeps } from "@/application/technician/record-service";
import { getVehicleHealth } from "@/application/vehicles/get-vehicle-health";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, REGISTRATION, TECHNICIAN } from "../vehicles/fakes";

describe("recordService", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: RecordServiceDeps;
  let vehicle: Vehicle;

  function stored() {
    return vehicles.vehicles[0];
  }

  function baselineOf(partId: string) {
    return stored().baselines.find((baseline) => baseline.partId === partId);
  }

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles, clock: new FakeClock() };
    // 45000 km, every baseline at 0 km on the purchase date: engine oil is long overdue.
    vehicle = await registerVehicle(deps, OWNER_A, REGISTRATION);
  });

  describe("VEH-16 technician records a serviced part", () => {
    it("starts with engine oil red", async () => {
      const { health } = await getVehicleHealth(deps, TECHNICIAN, vehicle.id);

      expect(health.find((part) => part.partId === "engine-oil")?.status).toBe("red");
    });

    it("updates the mileage, resets the baseline to that mileage and today, and turns the part green", async () => {
      const result = await recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 45200 });

      expect(stored().currentMileageKm).toBe(45200);
      expect(baselineOf("engine-oil")).toEqual({ partId: "engine-oil", mileageKm: 45200, date: "2026-03-10" });
      expect(result.vehicle.currentMileageKm).toBe(45200);
      expect(result.health.find((part) => part.partId === "engine-oil")?.status).toBe("green");
    });

    it("keeps the current mileage when none is given and uses it as the baseline", async () => {
      const result = await recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil" });

      expect(stored().currentMileageKm).toBe(45000);
      expect(baselineOf("engine-oil")).toEqual({ partId: "engine-oil", mileageKm: 45000, date: "2026-03-10" });
      expect(result.health.find((part) => part.partId === "engine-oil")?.status).toBe("green");
    });

    it("accepts a mileage equal to the current one", async () => {
      await recordService(deps, TECHNICIAN, vehicle.id, { partId: "tires", currentMileageKm: 45000 });

      expect(baselineOf("tires")).toMatchObject({ mileageKm: 45000 });
    });

    it("leaves the other seven baselines and the vehicle's details alone", async () => {
      const before = stored().baselines.filter((baseline) => baseline.partId !== "engine-oil");

      await recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 45200 });

      expect(stored().baselines).toHaveLength(8);
      expect(stored().baselines.filter((baseline) => baseline.partId !== "engine-oil")).toEqual(before);
      expect(stored()).toMatchObject({ plate: "ABC-123", make: "Toyota", ownerId: OWNER_A.id });
    });

    it("reaches a vehicle that belongs to an owner", async () => {
      await expect(recordService(deps, TECHNICIAN, vehicle.id, { partId: "coolant" })).resolves.toBeDefined();
    });

    it("returns the same shape as the vehicle health", async () => {
      const result = await recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 45200 });

      expect(result).toEqual(await getVehicleHealth(deps, TECHNICIAN, vehicle.id));
      expect(Object.keys(result).sort()).toEqual(["dues", "health", "nextMaintenance", "overallStatus", "vehicle"]);
    });
  });

  it("MNT-08 recomputes the next maintenance from the remaining parts and the new baseline", async () => {
    const before = await getVehicleHealth(deps, TECHNICIAN, vehicle.id);
    expect(before.nextMaintenance.parts).toContain("engine-oil");

    const after = await recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 45200 });

    const engineOilDue = after.dues.find((due) => due.partId === "engine-oil");
    expect(engineOilDue?.overdue).toBe(false);
    expect(engineOilDue?.dueMileageKm).toBe(50200);
    expect(after.nextMaintenance).not.toEqual(before.nextMaintenance);
  });

  describe("the odometer never goes back", () => {
    it("VEH-09 rejects a mileage lower than the current one with the same message and changes nothing", async () => {
      const error = await recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 44999 }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({ currentMileageKm: "Mileage cannot be lower than the current value" });
      expect(stored().currentMileageKm).toBe(45000);
      expect(baselineOf("engine-oil")).toMatchObject({ mileageKm: 0 });
    });

    it("rejects a mileage above 1,000,000 km and accepts exactly 1,000,000", async () => {
      await expect(
        recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 1_000_001 }),
      ).rejects.toMatchObject({ errors: { currentMileageKm: "Mileage cannot be more than 1,000,000 km" } });
      await expect(
        recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm: 1_000_000 }),
      ).resolves.toBeDefined();
    });

    it("rejects a mileage that is not a whole number", async () => {
      for (const currentMileageKm of [45200.5, "45200", null, Number.NaN]) {
        await expect(recordService(deps, TECHNICIAN, vehicle.id, { partId: "engine-oil", currentMileageKm })).rejects.toBeInstanceOf(
          ValidationError,
        );
      }
      expect(stored().currentMileageKm).toBe(45000);
    });
  });

  describe("input validation", () => {
    it("rejects a part outside the catalog or missing and changes nothing", async () => {
      const unknown = await recordService(deps, TECHNICIAN, vehicle.id, { partId: "wipers" }).catch((e) => e);
      const missing = await recordService(deps, TECHNICIAN, vehicle.id, {}).catch((e) => e);

      expect(unknown).toBeInstanceOf(ValidationError);
      expect(unknown.errors).toEqual({ partId: "Part must be one of the 8 tracked parts" });
      expect(missing.errors).toEqual({ partId: "Part is required" });
      expect(stored().baselines.every((baseline) => baseline.mileageKm === 0)).toBe(true);
    });

    it("rejects input that is not an object", async () => {
      await expect(recordService(deps, TECHNICIAN, vehicle.id, undefined)).rejects.toBeInstanceOf(ValidationError);
      await expect(recordService(deps, TECHNICIAN, vehicle.id, "engine-oil")).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("access", () => {
    it("AUTH-15 refuses an owner with Forbidden, even on their own vehicle, and changes nothing", async () => {
      await expect(recordService(deps, OWNER_A, vehicle.id, { partId: "engine-oil" })).rejects.toBeInstanceOf(Forbidden);
      await expect(recordService(deps, OWNER_A, "no-such-vehicle", { partId: "engine-oil" })).rejects.toBeInstanceOf(Forbidden);
      expect(baselineOf("engine-oil")).toMatchObject({ mileageKm: 0 });
    });

    it("answers an unknown vehicle with NotFound", async () => {
      const error = await recordService(deps, TECHNICIAN, "no-such-vehicle", { partId: "engine-oil" }).catch((e) => e);

      expect(error).toBeInstanceOf(NotFound);
      expect(error.message).toBe("Vehicle not found");
    });

    it("checks the vehicle before the input, as the owner use cases do", async () => {
      await expect(recordService(deps, TECHNICIAN, "no-such-vehicle", {})).rejects.toBeInstanceOf(NotFound);
    });
  });

  it("MNT-08 uses the clock's date as today for the new baseline", async () => {
    deps = { vehicles, clock: new FakeClock(new Date("2026-09-01T12:00:00Z")) };

    await recordService(deps, TECHNICIAN, vehicle.id, { partId: "battery" });

    expect(baselineOf("battery")).toEqual({ partId: "battery", mileageKm: 45000, date: "2026-09-01" });
  });
});
