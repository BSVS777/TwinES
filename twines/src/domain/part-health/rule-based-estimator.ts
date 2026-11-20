import { daysBetween, type CalendarDate } from "../shared/calendar-date";
import { MAINTENANCE_CATALOG, type CatalogPart, type PartId } from "./catalog";
import type {
  HealthEstimator,
  PartBaseline,
  PartHealth,
  VehicleSnapshot,
} from "./health-estimator";
import { statusForRatio } from "./status";

/** Time intervals are expressed in months; a month counts as 30 days. */
const DAYS_PER_MONTH = 30;

export class MissingBaselineError extends Error {
  constructor(readonly partId: PartId) {
    super(`Missing baseline for part "${partId}"`);
    this.name = "MissingBaselineError";
  }
}

function estimatePart(
  part: CatalogPart,
  baseline: PartBaseline,
  currentMileageKm: number,
  today: CalendarDate,
): PartHealth {
  const intervalDays = part.monthInterval * DAYS_PER_MONTH;
  const elapsedDays = daysBetween(baseline.date, today);
  const timeRatio = elapsedDays / intervalDays;

  let kmRatio = 0;
  let remainingKm: number | null = null;
  if (part.kmInterval !== null) {
    const elapsedKm = currentMileageKm - baseline.mileageKm;
    kmRatio = elapsedKm / part.kmInterval;
    remainingKm = part.kmInterval - elapsedKm;
  }

  const usageRatio = Math.max(kmRatio, timeRatio);
  return {
    partId: part.id,
    usageRatio,
    status: statusForRatio(usageRatio),
    remainingKm,
    remainingDays: intervalDays - elapsedDays,
  };
}

/** Deterministic estimator: usage is the greater of the km and time ratios. */
export class RuleBasedHealthEstimator implements HealthEstimator {
  estimate(vehicle: VehicleSnapshot, today: CalendarDate): PartHealth[] {
    return MAINTENANCE_CATALOG.map((part) => {
      const baseline = vehicle.baselines.find((candidate) => candidate.partId === part.id);
      if (!baseline) throw new MissingBaselineError(part.id);
      return estimatePart(part, baseline, vehicle.currentMileageKm, today);
    });
  }
}

/** The estimator used by default; swap it here to change every caller at once. */
export function createHealthEstimator(): HealthEstimator {
  return new RuleBasedHealthEstimator();
}
