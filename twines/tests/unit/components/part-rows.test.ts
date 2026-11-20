import { describe, expect, it } from "vitest";
import { buildPartRows, describeRemainingDays, describeRemainingKm, partName, STATUS_LABEL } from "@/components/vehicle-health/part-rows";
import type { PartDue } from "@/domain/maintenance/schedule";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import type { PartHealth } from "@/domain/part-health/health-estimator";

const health: PartHealth[] = MAINTENANCE_CATALOG.map((part, index) => ({
  partId: part.id,
  usageRatio: index === 0 ? 1.1249 : 0.2,
  status: index === 0 ? "red" : "green",
  remainingKm: part.kmInterval === null ? null : -600,
  remainingDays: index === 0 ? -12 : 100,
}));
const dues: PartDue[] = MAINTENANCE_CATALOG.map((part, index) => ({
  partId: part.id,
  dueMileageKm: part.kmInterval,
  effectiveDueDate: "2026-11-08" as PartDue["effectiveDueDate"],
  overdue: index === 0,
}));

describe("buildPartRows", () => {
  it("VIEW-02 merges health and dues into one serializable row per catalog part, in catalog order", () => {
    const rows = buildPartRows(health, dues);

    expect(rows.map((row) => row.partId)).toEqual(MAINTENANCE_CATALOG.map((part) => part.id));
    expect(rows[0]).toEqual({
      partId: "engine-oil",
      name: "Engine oil",
      status: "red",
      usagePercent: 112,
      remainingKm: -600,
      remainingDays: -12,
      dueDate: "2026-11-08",
      overdue: true,
    });
    expect(rows[5].remainingKm).toBeNull();
    expect(rows[1].overdue).toBe(false);
    expect(JSON.parse(JSON.stringify(rows))).toEqual(rows);
  });

  it("looks a part name up by id and labels every status", () => {
    expect(partName("spark-plugs")).toBe("Spark plugs");
    expect(STATUS_LABEL).toEqual({ green: "Green", yellow: "Yellow", orange: "Orange", red: "Red" });
  });

  it("throws when a part has no matching due, instead of showing a wrong date", () => {
    expect(() => buildPartRows(health, dues.slice(1))).toThrow(/engine-oil/);
  });
});

describe("remaining text", () => {
  it("VIEW-02 describes km left, overdue and time-based parts", () => {
    expect(describeRemainingKm(1000)).toBe("1,000 km left");
    expect(describeRemainingKm(0)).toBe("0 km left");
    expect(describeRemainingKm(-600)).toBe("600 km overdue");
    expect(describeRemainingKm(null)).toBe("Time-based");
  });

  it("VIEW-02 describes days left and overdue with correct singular forms", () => {
    expect(describeRemainingDays(36)).toBe("36 days left");
    expect(describeRemainingDays(1)).toBe("1 day left");
    expect(describeRemainingDays(0)).toBe("0 days left");
    expect(describeRemainingDays(-1)).toBe("1 day overdue");
    expect(describeRemainingDays(-12)).toBe("12 days overdue");
  });
});
