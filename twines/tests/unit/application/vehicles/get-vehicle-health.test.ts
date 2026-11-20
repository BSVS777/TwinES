import { beforeEach, describe, expect, it } from "vitest";
import { NotFound } from "@/application/errors";
import type { Vehicle } from "@/application/ports";
import { getVehicleHealth, type GetVehicleHealthDeps } from "@/application/vehicles/get-vehicle-health";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { computeNextMaintenance, computePartDues } from "@/domain/maintenance/schedule";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import type { HealthEstimator, PartHealth } from "@/domain/part-health/health-estimator";
import { createHealthEstimator } from "@/domain/part-health/rule-based-estimator";
import { worstStatus } from "@/domain/part-health/status";
import { parseCalendarDate } from "@/domain/shared/calendar-date";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, OWNER_B, REGISTRATION, TECHNICIAN } from "./fakes";

const TODAY = parseCalendarDate("2026-03-10");

describe("getVehicleHealth", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: GetVehicleHealthDeps;
  let vehicle: Vehicle;

  /** Gives every part a baseline at the vehicle's current mileage today, so all parts are green. */
  async function serviceEverythingToday() {
    for (const part of MAINTENANCE_CATALOG) {
      await vehicles.upsertBaseline(vehicle.id, { partId: part.id, mileageKm: 45000, date: TODAY });
    }
  }

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles, clock: new FakeClock() };
    vehicle = await registerVehicle(deps, OWNER_A, REGISTRATION);
  });

  it("composes the estimator, the due dates and the next maintenance for the owner's vehicle", async () => {
    const result = await getVehicleHealth(deps, OWNER_A, vehicle.id);

    const stored = vehicles.vehicles[0];
    const snapshot = {
      currentMileageKm: stored.currentMileageKm,
      monthlyMileageKm: stored.monthlyMileageKm,
      baselines: stored.baselines,
    };
    const dues = computePartDues(snapshot, TODAY);
    expect(result.vehicle).toMatchObject({ id: vehicle.id, plate: "ABC-123", make: "Toyota", model: "Corolla" });
    expect(result.health).toEqual(createHealthEstimator().estimate(snapshot, TODAY));
    expect(result.dues).toEqual(dues);
    expect(result.nextMaintenance).toEqual(computeNextMaintenance(dues, snapshot, TODAY));
    expect(result.health).toHaveLength(8);
    expect(result.dues).toHaveLength(8);
  });

  it("uses the clock's date, not the machine's", async () => {
    deps = { vehicles, clock: new FakeClock(new Date("2026-09-01T12:00:00Z")) };
    await serviceEverythingToday();

    const result = await getVehicleHealth(deps, OWNER_A, vehicle.id);

    const engineOil = result.health.find((part) => part.partId === "engine-oil");
    // 175 days after 2026-03-10: the time ratio is 175 / 180 of the 6-month interval.
    expect(engineOil?.remainingDays).toBe(5);
    expect(engineOil?.status).toBe("orange");
  });

  it("HLT-09 reports the worst part status as the overall status", async () => {
    // Default baselines are 0 km on the 2020 purchase date, so every part is far past its limits.
    expect((await getVehicleHealth(deps, OWNER_A, vehicle.id)).overallStatus).toBe("red");

    await serviceEverythingToday();
    expect((await getVehicleHealth(deps, OWNER_A, vehicle.id)).overallStatus).toBe("green");

    await vehicles.upsertBaseline(vehicle.id, { partId: "engine-oil", mileageKm: 42000, date: TODAY });
    const result = await getVehicleHealth(deps, OWNER_A, vehicle.id);
    expect(result.health.find((part) => part.partId === "engine-oil")?.status).toBe("yellow");
    expect(result.overallStatus).toBe("yellow");
    expect(result.overallStatus).toBe(worstStatus(result.health.map((part) => part.status)));
  });

  it("recomputes from the stored baselines after a baseline changes (MNT-08)", async () => {
    const before = await getVehicleHealth(deps, OWNER_A, vehicle.id);
    await serviceEverythingToday();

    const after = await getVehicleHealth(deps, OWNER_A, vehicle.id);

    expect(before.nextMaintenance.overdue).toBe(true);
    expect(after.nextMaintenance.overdue).toBe(false);
    expect(after.nextMaintenance.parts.length).toBeGreaterThan(0);
  });

  it("VEH-12 answers NotFound for another owner's vehicle and for an id that does not exist", async () => {
    await expect(getVehicleHealth(deps, OWNER_B, vehicle.id)).rejects.toBeInstanceOf(NotFound);
    await expect(getVehicleHealth(deps, OWNER_A, "no-such-vehicle")).rejects.toBeInstanceOf(NotFound);
  });

  it("answers the same NotFound for both cases so existence is not disclosed", async () => {
    const other = await getVehicleHealth(deps, OWNER_B, vehicle.id).catch((e) => e);
    const missing = await getVehicleHealth(deps, OWNER_B, "no-such-vehicle").catch((e) => e);

    expect(other.message).toBe(missing.message);
  });

  it("VEH-14 lets a technician read any vehicle", async () => {
    const result = await getVehicleHealth(deps, TECHNICIAN, vehicle.id);

    expect(result.vehicle.id).toBe(vehicle.id);
    await expect(getVehicleHealth(deps, TECHNICIAN, "no-such-vehicle")).rejects.toBeInstanceOf(NotFound);
  });

  it("HLT-10 uses the estimator it is given instead of the default", async () => {
    const stub: PartHealth[] = MAINTENANCE_CATALOG.map((part) => ({
      partId: part.id,
      usageRatio: 0.6,
      status: "yellow",
      remainingKm: null,
      remainingDays: 1,
    }));
    const estimator: HealthEstimator = { estimate: () => stub };

    const result = await getVehicleHealth({ ...deps, estimator }, OWNER_A, vehicle.id);

    expect(result.health).toBe(stub);
    expect(result.overallStatus).toBe("yellow");
  });
});
