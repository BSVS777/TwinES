import { describe, expect, it } from "vitest";
import { MAINTENANCE_CATALOG, type PartId } from "@/domain/part-health/catalog";
import type {
  PartBaseline,
  PartHealth,
  VehicleSnapshot,
} from "@/domain/part-health/health-estimator";
import {
  createHealthEstimator,
  MissingBaselineError,
  RuleBasedHealthEstimator,
} from "@/domain/part-health/rule-based-estimator";
import { addDays, parseCalendarDate } from "@/domain/shared/calendar-date";

const TODAY = parseCalendarDate("2026-06-15");

/** Baselines for all 8 parts at the given mileage and date, with optional per-part overrides. */
function snapshot(
  currentMileageKm: number,
  baseline: { mileageKm: number; daysAgo: number },
  overrides: Partial<Record<PartId, { mileageKm: number; daysAgo: number }>> = {},
): VehicleSnapshot {
  const baselines: PartBaseline[] = MAINTENANCE_CATALOG.map((part) => {
    const value = overrides[part.id] ?? baseline;
    return { partId: part.id, mileageKm: value.mileageKm, date: addDays(TODAY, -value.daysAgo) };
  });
  return { currentMileageKm, monthlyMileageKm: 1000, baselines };
}

function healthOf(results: PartHealth[], partId: PartId): PartHealth {
  const found = results.find((result) => result.partId === partId);
  if (!found) throw new Error(`no result for ${partId}`);
  return found;
}

const estimator = new RuleBasedHealthEstimator();

describe("RuleBasedHealthEstimator", () => {
  it("returns one result per catalog part in catalog order", () => {
    const results = estimator.estimate(snapshot(44000, { mileageKm: 44000, daysAgo: 0 }), TODAY);
    expect(results.map((result) => result.partId)).toEqual(MAINTENANCE_CATALOG.map((p) => p.id));
  });

  it("HLT-02 lets km dominate: oil at 40,000 km set 30 days ago, now 44,000", () => {
    const vehicle = snapshot(44000, { mileageKm: 44000, daysAgo: 0 }, {
      "engine-oil": { mileageKm: 40000, daysAgo: 30 },
    });
    const oil = healthOf(estimator.estimate(vehicle, TODAY), "engine-oil");
    expect(oil.usageRatio).toBeCloseTo(0.8, 10);
    expect(oil.usageRatio).toBeGreaterThan(30 / 180);
    expect(oil.status).toBe("orange");
  });

  it("HLT-03 lets time dominate: air filter at 44,000 km set 300 days ago, now 45,000", () => {
    const vehicle = snapshot(45000, { mileageKm: 45000, daysAgo: 0 }, {
      "air-filter": { mileageKm: 44000, daysAgo: 300 },
    });
    const filter = healthOf(estimator.estimate(vehicle, TODAY), "air-filter");
    expect(1000 / 15000).toBeCloseTo(0.07, 2);
    expect(filter.usageRatio).toBeCloseTo(300 / 360, 10);
    expect(filter.status).toBe("orange");
  });

  it("HLT-04 tracks the battery by time only: baseline 540 days ago", () => {
    const vehicle = snapshot(44000, { mileageKm: 44000, daysAgo: 0 }, {
      battery: { mileageKm: 0, daysAgo: 540 },
    });
    const battery = healthOf(estimator.estimate(vehicle, TODAY), "battery");
    expect(battery.usageRatio).toBeCloseTo(0.5, 10);
    expect(battery.status).toBe("yellow");
    expect(battery.remainingKm).toBeNull();
    expect(battery.remainingDays).toBe(540);
  });

  it("HLT-05 reports ratio 0 and green when just serviced", () => {
    const results = estimator.estimate(snapshot(44000, { mileageKm: 44000, daysAgo: 0 }), TODAY);
    expect(results).toHaveLength(8);
    for (const result of results) {
      expect(result.usageRatio).toBe(0);
      expect(result.status).toBe("green");
    }
  });

  it("HLT-07 reports remaining km and days: oil at 40,000 km set 30 days ago, now 44,000", () => {
    const vehicle = snapshot(44000, { mileageKm: 44000, daysAgo: 0 }, {
      "engine-oil": { mileageKm: 40000, daysAgo: 30 },
    });
    const oil = healthOf(estimator.estimate(vehicle, TODAY), "engine-oil");
    expect(oil.remainingKm).toBe(1000);
    expect(oil.remainingDays).toBe(150);
  });

  it("HLT-08 reports overdue km as a negative value: oil at 38,000 km, now 44,000", () => {
    const vehicle = snapshot(44000, { mileageKm: 44000, daysAgo: 0 }, {
      "engine-oil": { mileageKm: 38000, daysAgo: 0 },
    });
    const oil = healthOf(estimator.estimate(vehicle, TODAY), "engine-oil");
    expect(oil.remainingKm).toBe(-1000);
    expect(oil.usageRatio).toBeCloseTo(1.2, 10);
    expect(oil.status).toBe("red");
  });

  it("HLT-08 reports overdue days as a negative value", () => {
    const vehicle = snapshot(44000, { mileageKm: 44000, daysAgo: 0 }, {
      "engine-oil": { mileageKm: 44000, daysAgo: 200 },
    });
    const oil = healthOf(estimator.estimate(vehicle, TODAY), "engine-oil");
    expect(oil.remainingDays).toBe(-20);
    expect(oil.status).toBe("red");
  });

  it("is deterministic for the same vehicle and date", () => {
    const vehicle = snapshot(44000, { mileageKm: 40000, daysAgo: 100 });
    expect(estimator.estimate(vehicle, TODAY)).toEqual(estimator.estimate(vehicle, TODAY));
  });

  it("throws a clear error when a catalog part has no baseline", () => {
    const vehicle = snapshot(44000, { mileageKm: 44000, daysAgo: 0 });
    vehicle.baselines = vehicle.baselines.filter((baseline) => baseline.partId !== "coolant");
    expect(() => estimator.estimate(vehicle, TODAY)).toThrow(MissingBaselineError);
    expect(() => estimator.estimate(vehicle, TODAY)).toThrow(/coolant/);
  });
});

describe("createHealthEstimator", () => {
  it("HLT-10 returns the rule-based estimator by default", () => {
    expect(createHealthEstimator()).toBeInstanceOf(RuleBasedHealthEstimator);
  });

  it("HLT-10 produces results through the HealthEstimator port", () => {
    const vehicle = snapshot(44000, { mileageKm: 40000, daysAgo: 30 });
    const results = createHealthEstimator().estimate(vehicle, TODAY);
    expect(results).toHaveLength(8);
    expect(healthOf(results, "engine-oil").usageRatio).toBeCloseTo(0.8, 10);
  });
});
