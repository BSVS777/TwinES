import { addDays, daysBetween, type CalendarDate } from "../shared/calendar-date";
import { MAINTENANCE_CATALOG, type CatalogPart, type PartId } from "../part-health/catalog";
import type { PartBaseline, VehicleSnapshot } from "../part-health/health-estimator";
import { MissingBaselineError } from "../part-health/rule-based-estimator";

/** Time intervals are expressed in months; a month counts as 30 days. */
const DAYS_PER_MONTH = 30;

export interface PartDue {
  partId: PartId;
  /** Null for time-only parts. */
  dueMileageKm: number | null;
  effectiveDueDate: CalendarDate;
  overdue: boolean;
}

function earlier(a: CalendarDate, b: CalendarDate): CalendarDate {
  return daysBetween(a, b) < 0 ? b : a;
}

function dueFor(
  part: CatalogPart,
  baseline: PartBaseline,
  vehicle: VehicleSnapshot,
  today: CalendarDate,
): PartDue {
  const timeDueDate = addDays(baseline.date, part.monthInterval * DAYS_PER_MONTH);
  const dueMileageKm = part.kmInterval === null ? null : baseline.mileageKm + part.kmInterval;

  let effectiveDueDate = timeDueDate;
  if (dueMileageKm !== null && vehicle.monthlyMileageKm > 0) {
    const kmPerDay = vehicle.monthlyMileageKm / DAYS_PER_MONTH;
    const daysToDueMileage = Math.ceil((dueMileageKm - vehicle.currentMileageKm) / kmPerDay);
    effectiveDueDate = earlier(timeDueDate, addDays(today, daysToDueMileage));
  }

  const overdueByDate = daysBetween(effectiveDueDate, today) >= 0;
  const overdueByMileage = dueMileageKm !== null && vehicle.currentMileageKm >= dueMileageKm;
  return {
    partId: part.id,
    dueMileageKm,
    effectiveDueDate,
    overdue: overdueByDate || overdueByMileage,
  };
}

/** Due mileage, effective due date and overdue flag for every catalog part, in catalog order. */
export function computePartDues(vehicle: VehicleSnapshot, today: CalendarDate): PartDue[] {
  return MAINTENANCE_CATALOG.map((part) => {
    const baseline = vehicle.baselines.find((candidate) => candidate.partId === part.id);
    if (!baseline) throw new MissingBaselineError(part.id);
    return dueFor(part, baseline, vehicle, today);
  });
}

export interface NextMaintenance {
  date: CalendarDate;
  overdue: boolean;
  parts: PartId[];
  estimatedMileageKm: number;
}

/** Parts due within this many days after the visit date share the same visit. */
const GROUPING_WINDOW_DAYS = 30;

/**
 * The next recommended visit: today when anything is overdue, otherwise the earliest due date,
 * grouping every part due within the window after it.
 */
export function computeNextMaintenance(
  dues: PartDue[],
  vehicle: VehicleSnapshot,
  today: CalendarDate,
): NextMaintenance {
  if (dues.length === 0) throw new RangeError("Cannot compute the next maintenance without part dues");

  const overdue = dues.some((due) => due.overdue);
  const date = overdue
    ? today
    : dues.map((due) => due.effectiveDueDate).reduce((first, next) => earlier(first, next));
  const parts = dues
    .filter((due) => due.overdue || daysBetween(date, due.effectiveDueDate) <= GROUPING_WINDOW_DAYS)
    .map((due) => due.partId);

  const kmPerDay = vehicle.monthlyMileageKm / DAYS_PER_MONTH;
  const estimatedMileageKm = Math.round(vehicle.currentMileageKm + kmPerDay * daysBetween(today, date));
  return { date, overdue, parts, estimatedMileageKm };
}
