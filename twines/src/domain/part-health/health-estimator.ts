import type { CalendarDate } from "../shared/calendar-date";
import type { PartId } from "./catalog";

export type HealthStatus = "green" | "yellow" | "orange" | "red";

export interface PartBaseline {
  partId: PartId;
  mileageKm: number;
  date: CalendarDate;
}

export interface VehicleSnapshot {
  currentMileageKm: number;
  monthlyMileageKm: number;
  baselines: PartBaseline[];
}

export interface PartHealth {
  partId: PartId;
  /** Unrounded; the greater of the km and time ratios. */
  usageRatio: number;
  status: HealthStatus;
  /** Negative means overdue km; null for time-only parts. */
  remainingKm: number | null;
  /** Negative means overdue days. */
  remainingDays: number;
}

/** Extension point: a future estimator can replace the rule-based one without changing callers. */
export interface HealthEstimator {
  estimate(vehicle: VehicleSnapshot, today: CalendarDate): PartHealth[];
}
