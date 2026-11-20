import { describe, expect, it } from "vitest";
import { computePartDues, type PartDue } from "@/domain/maintenance/schedule";
import { MAINTENANCE_CATALOG, type PartId } from "@/domain/part-health/catalog";
import type { PartBaseline, VehicleSnapshot } from "@/domain/part-health/health-estimator";
import { MissingBaselineError } from "@/domain/part-health/rule-based-estimator";
import { addDays, parseCalendarDate } from "@/domain/shared/calendar-date";

const TODAY = parseCalendarDate("2026-11-19");

type BaselineValue = { mileageKm: number; date: string };

/** All 8 parts serviced today at the current mileage, with optional per-part overrides. */
function vehicle(
  currentMileageKm: number,
  monthlyMileageKm: number,
  overrides: Partial<Record<PartId, BaselineValue>> = {},
): VehicleSnapshot {
  const baselines: PartBaseline[] = MAINTENANCE_CATALOG.map((part) => {
    const value = overrides[part.id] ?? { mileageKm: currentMileageKm, date: TODAY };
    return { partId: part.id, mileageKm: value.mileageKm, date: parseCalendarDate(value.date) };
  });
  return { currentMileageKm, monthlyMileageKm, baselines };
}

function dueOf(dues: PartDue[], partId: PartId): PartDue {
  const found = dues.find((due) => due.partId === partId);
  if (!found) throw new Error(`no due for ${partId}`);
  return found;
}

const OIL_40K = { mileageKm: 40000, date: "2026-11-01" };

describe("computePartDues", () => {
  it("returns one due per catalog part in catalog order", () => {
    const dues = computePartDues(vehicle(44000, 1500), TODAY);
    expect(dues.map((due) => due.partId)).toEqual(MAINTENANCE_CATALOG.map((part) => part.id));
  });

  it("MNT-01 uses the earlier km-based date over the time-based date", () => {
    const dues = computePartDues(vehicle(44000, 1500, { "engine-oil": OIL_40K }), TODAY);
    expect(dueOf(dues, "engine-oil")).toEqual({
      partId: "engine-oil",
      dueMileageKm: 45000,
      effectiveDueDate: "2026-12-09",
      overdue: false,
    });
  });

  it("MNT-01 time-based due date is baseline + 180 days when km is not projected", () => {
    const dues = computePartDues(vehicle(44000, 0, { "engine-oil": OIL_40K }), TODAY);
    expect(dueOf(dues, "engine-oil").effectiveDueDate).toBe("2027-04-30");
  });

  it("picks the time-based date when it is earlier than the km-based date", () => {
    const baseline = { mileageKm: 44000, date: "2026-06-01" };
    const dues = computePartDues(vehicle(44000, 1500, { "engine-oil": baseline }), TODAY);
    const due = dueOf(dues, "engine-oil");
    expect(due.effectiveDueDate).toBe("2026-11-28");
    expect(due.overdue).toBe(false);
  });

  it("rounds the km-based day count up", () => {
    const dues = computePartDues(vehicle(44040, 1500, { "engine-oil": OIL_40K }), TODAY);
    expect(dueOf(dues, "engine-oil").effectiveDueDate).toBe(addDays(TODAY, 20));
  });

  it("MNT-02 uses only time-based dates when monthly mileage is zero", () => {
    const dues = computePartDues(vehicle(44000, 0), TODAY);
    for (const part of MAINTENANCE_CATALOG) {
      expect(dueOf(dues, part.id).effectiveDueDate).toBe(addDays(TODAY, part.monthInterval * 30));
    }
  });

  it("MNT-03 time-only part has no due mileage and is due baseline + 1,080 days", () => {
    const battery = { mileageKm: 30000, date: "2025-01-01" };
    const dues = computePartDues(vehicle(44000, 1500, { battery }), TODAY);
    expect(dueOf(dues, "battery")).toEqual({
      partId: "battery",
      dueMileageKm: null,
      effectiveDueDate: "2027-12-17",
      overdue: false,
    });
  });

  it("MNT-04 marks a part overdue when current mileage equals its due mileage", () => {
    const dues = computePartDues(vehicle(45000, 1500, { "engine-oil": OIL_40K }), TODAY);
    expect(dueOf(dues, "engine-oil").overdue).toBe(true);
  });

  it("MNT-04 does not mark a part overdue one km before its due mileage", () => {
    const dues = computePartDues(vehicle(44999, 1500, { "engine-oil": OIL_40K }), TODAY);
    const due = dueOf(dues, "engine-oil");
    expect(due.effectiveDueDate).toBe("2026-11-20");
    expect(due.overdue).toBe(false);
  });

  it("MNT-04 marks overdue by mileage even when the due date is still in the future", () => {
    const dues = computePartDues(vehicle(46000, 0, { "engine-oil": OIL_40K }), TODAY);
    const due = dueOf(dues, "engine-oil");
    expect(due.effectiveDueDate).toBe("2027-04-30");
    expect(due.overdue).toBe(true);
  });

  it("keeps the km-based date in the past once the due mileage is exceeded", () => {
    const dues = computePartDues(vehicle(46000, 1500, { "engine-oil": OIL_40K }), TODAY);
    expect(dueOf(dues, "engine-oil").effectiveDueDate).toBe(addDays(TODAY, -20));
  });

  it("MNT-05 marks a part overdue when its time-based due date was yesterday", () => {
    const battery = { mileageKm: 44000, date: addDays(TODAY, -1081) };
    const due = dueOf(computePartDues(vehicle(44000, 1500, { battery }), TODAY), "battery");
    expect(due.effectiveDueDate).toBe(addDays(TODAY, -1));
    expect(due.overdue).toBe(true);
  });

  it("MNT-05 marks a part overdue when its due date is today and not when it is tomorrow", () => {
    const dueToday = { mileageKm: 44000, date: addDays(TODAY, -1080) };
    const dueTomorrow = { mileageKm: 44000, date: addDays(TODAY, -1079) };
    const today = computePartDues(vehicle(44000, 0, { battery: dueToday }), TODAY);
    const tomorrow = computePartDues(vehicle(44000, 0, { battery: dueTomorrow }), TODAY);
    expect(dueOf(today, "battery").overdue).toBe(true);
    expect(dueOf(tomorrow, "battery").overdue).toBe(false);
  });

  it("throws MissingBaselineError when a catalog part has no baseline", () => {
    const incomplete = vehicle(44000, 1500);
    incomplete.baselines = incomplete.baselines.filter((entry) => entry.partId !== "coolant");
    expect(() => computePartDues(incomplete, TODAY)).toThrow(MissingBaselineError);
  });
});
