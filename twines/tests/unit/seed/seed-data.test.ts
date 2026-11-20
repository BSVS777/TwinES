import { describe, expect, it } from "vitest";
import { parseInput } from "@/application/validation/parse";
import { baselineSchema, vehicleSchema } from "@/application/validation/vehicle";
import { computeNextMaintenance, computePartDues } from "@/domain/maintenance/schedule";
import { MAINTENANCE_CATALOG, type PartId } from "@/domain/part-health/catalog";
import type { HealthStatus } from "@/domain/part-health/health-estimator";
import { createHealthEstimator } from "@/domain/part-health/rule-based-estimator";
import { worstStatus } from "@/domain/part-health/status";
import { daysBetween, parseCalendarDate } from "@/domain/shared/calendar-date";
import {
  SEED_EMAILS,
  SEED_EXPECTATIONS,
  SEED_VEHICLES,
  buildSeedVehicle,
  relativeBaseline,
} from "../../../prisma/seed-data";

const TODAY = parseCalendarDate("2026-11-20");
// Month ends, a leap day, a year end and a far date: the statuses must not depend on the day.
const DATES = ["2026-11-20", "2027-02-28", "2028-02-29", "2026-01-01", "2030-12-31"].map(parseCalendarDate);
const STATUSES: HealthStatus[] = ["green", "yellow", "orange", "red"];
const DRIVERS = ["km", "time"] as const;
const estimator = createHealthEstimator();

/** The estimated status of one part when only its baseline is built from the target. */
function estimatedStatus(partId: PartId, status: HealthStatus, driver: "km" | "time", mileage: number, today = TODAY) {
  const baselines = MAINTENANCE_CATALOG.map((part) =>
    part.id === partId
      ? relativeBaseline(partId, status, driver, mileage, today)
      : relativeBaseline(part.id, "green", "km", mileage, today),
  );
  const health = estimator.estimate({ currentMileageKm: mileage, monthlyMileageKm: 1000, baselines }, today);
  return health.find((part) => part.partId === partId)!.status;
}

describe("relativeBaseline", () => {
  const cases = MAINTENANCE_CATALOG.flatMap((part) =>
    STATUSES.flatMap((status) => DRIVERS.map((driver) => [part.id, status, driver] as const)),
  );

  it.each(cases)("%s driven by %s lands on %s", (partId, status, driver) => {
    expect(estimatedStatus(partId, status, driver, 80_000)).toBe(status);
  });

  it.each(DATES.map((date) => [date] as const))("lands on the target status when today is %s", (today) => {
    for (const [partId, status, driver] of cases) {
      expect(estimatedStatus(partId, status, driver, 80_000, today), `${partId} ${status} ${driver}`).toBe(status);
    }
  });

  it("measures the baseline date back from today, in days", () => {
    const baseline = relativeBaseline("engine-oil", "yellow", "time", 40_000, TODAY);

    // Engine oil: 6 months of 30 days; yellow targets 60% of the interval.
    expect(daysBetween(baseline.date, TODAY)).toBe(108);
    expect(baseline.mileageKm).toBe(40_000);
  });

  it("measures the baseline mileage back from the current mileage when km drives the status", () => {
    const baseline = relativeBaseline("engine-oil", "orange", "km", 40_000, TODAY);

    // Engine oil: 5,000 km; orange targets 85% of the interval.
    expect(baseline.mileageKm).toBe(40_000 - 4250);
    expect(daysBetween(baseline.date, TODAY)).toBeGreaterThan(0);
  });

  it("tracks the battery by time whatever driver is asked for", () => {
    const byKm = relativeBaseline("battery", "red", "km", 40_000, TODAY);

    expect(byKm.mileageKm).toBe(40_000);
    expect(estimatedStatus("battery", "red", "km", 40_000)).toBe("red");
  });

  it("never puts a baseline above the current mileage or in the future", () => {
    for (const part of MAINTENANCE_CATALOG) {
      for (const status of STATUSES) {
        const baseline = relativeBaseline(part.id, status, "km", 80_000, TODAY);
        expect(baseline.mileageKm).toBeLessThanOrEqual(80_000);
        expect(baseline.mileageKm).toBeGreaterThanOrEqual(0);
        expect(daysBetween(baseline.date, TODAY)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("refuses a status that would need a negative baseline mileage", () => {
    // A red tire set needs 62,500 km on the odometer.
    expect(() => relativeBaseline("tires", "red", "km", 10_000, TODAY)).toThrow(RangeError);
  });
});

describe("SEED_VEHICLES", () => {
  const ownerOne = SEED_VEHICLES.filter((vehicle) => vehicle.owner === "ownerOne");
  const ownerTwo = SEED_VEHICLES.filter((vehicle) => vehicle.owner === "ownerTwo");

  it("gives owner one every body type and owner two a single vehicle", () => {
    expect(new Set(ownerOne.map((vehicle) => vehicle.bodyType))).toEqual(new Set(["sedan", "hatchback", "suv", "pickup"]));
    expect(ownerTwo).toHaveLength(1);
  });

  it("uses distinct plates and one expectation per plate", () => {
    const plates = SEED_VEHICLES.map((vehicle) => vehicle.plate);

    expect(new Set(plates).size).toBe(plates.length);
    expect(Object.keys(SEED_EXPECTATIONS).sort()).toEqual([...plates].sort());
  });

  it("names the technician and owner accounts the end-to-end tests sign in with", () => {
    expect(SEED_EMAILS).toEqual({
      technician: "tech@twines.test",
      ownerOne: "owner.one@twines.test",
      ownerTwo: "owner.two@twines.test",
    });
  });

  it.each(DATES.map((date) => [date] as const))("builds data the registration and baseline rules accept when today is %s", (today) => {
    for (const spec of SEED_VEHICLES) {
      const { baselines, ...registration } = buildSeedVehicle(spec, today);

      expect(parseInput(vehicleSchema(today), registration).plate).toBe(spec.plate);
      expect(baselines).toHaveLength(8);
      for (const baseline of baselines) {
        expect(parseInput(baselineSchema(today), baseline)).toEqual(baseline);
        expect(baseline.mileageKm).toBeLessThanOrEqual(registration.currentMileageKm);
        expect(daysBetween(registration.purchaseDate, baseline.date)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("covers all-green, yellow, orange, red and an overdue next maintenance for owner one", () => {
    const overall = ownerOne.map((vehicle) => SEED_EXPECTATIONS[vehicle.plate].overallStatus);

    expect(new Set(overall)).toEqual(new Set(["green", "yellow", "orange", "red"]));
    expect(ownerOne.some((vehicle) => SEED_EXPECTATIONS[vehicle.plate].nextMaintenanceOverdue)).toBe(true);
    expect(ownerOne.some((vehicle) => !SEED_EXPECTATIONS[vehicle.plate].nextMaintenanceOverdue)).toBe(true);
  });

  it("has a vehicle whose next maintenance is overdue by time alone", () => {
    const timeOnly = ownerOne.filter((vehicle) =>
      Object.values(vehicle.parts).every((part) => part.status === "green" || part.driver === "time"),
    );

    expect(timeOnly.some((vehicle) => SEED_EXPECTATIONS[vehicle.plate].nextMaintenanceOverdue)).toBe(true);
  });

  describe.each(DATES.map((date) => [date] as const))("SEED_EXPECTATIONS when today is %s", (today) => {
    it("match what the estimator and the schedule say for every vehicle and part", () => {
      for (const spec of SEED_VEHICLES) {
        const vehicle = buildSeedVehicle(spec, today);
        const health = estimator.estimate(vehicle, today);
        const expected = SEED_EXPECTATIONS[spec.plate];

        for (const part of health) expect(part.status, `${spec.plate} ${part.partId}`).toBe(expected.parts[part.partId]);
        expect(worstStatus(health.map((part) => part.status)), spec.plate).toBe(expected.overallStatus);
        const next = computeNextMaintenance(computePartDues(vehicle, today), vehicle, today);
        expect(next.overdue, spec.plate).toBe(expected.nextMaintenanceOverdue);
      }
    });
  });
});
