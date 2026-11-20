import type { BodyType, NewVehicle } from "@/application/ports";
import { MAINTENANCE_CATALOG, type PartId } from "@/domain/part-health/catalog";
import type { HealthStatus, PartBaseline } from "@/domain/part-health/health-estimator";
import { worstStatus } from "@/domain/part-health/status";
import { addDays, daysBetween, type CalendarDate } from "@/domain/shared/calendar-date";

/** The accounts the seed creates. End-to-end tests sign in with these emails. */
export const SEED_EMAILS = {
  technician: "tech@twines.test",
  ownerOne: "owner.one@twines.test",
  ownerTwo: "owner.two@twines.test",
} as const;

export type SeedOwner = "ownerOne" | "ownerTwo";

/** What makes a part reach its status: the kilometers driven or the time passed. */
export type PartDriver = "km" | "time";

export interface SeedPartSpec {
  status: HealthStatus;
  /** Defaults to `km`; the battery is tracked by time only, so it is always `time`. */
  driver?: PartDriver;
}

export interface SeedVehicleSpec {
  owner: SeedOwner;
  plate: string;
  make: string;
  model: string;
  year: number;
  bodyType: BodyType;
  currentMileageKm: number;
  monthlyMileageKm: number;
  /** The vehicle was bought at least this many days ago (longer when a baseline is older). */
  minAgeDays: number;
  /** Parts that are not green; every part not listed is green. */
  parts: Partial<Record<PartId, SeedPartSpec>>;
}

/**
 * Owner one has a vehicle per body type and per overall status: all green, yellow, orange, red,
 * and one whose next maintenance is overdue by date alone. Owner two has one vehicle, for the
 * cross-owner checks.
 */
export const SEED_VEHICLES: readonly SeedVehicleSpec[] = [
  {
    owner: "ownerOne",
    plate: "TWN-GRN",
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    bodyType: "sedan",
    currentMileageKm: 18_000,
    monthlyMileageKm: 1000,
    minAgeDays: 1100,
    parts: {},
  },
  {
    owner: "ownerOne",
    plate: "TWN-YLW",
    make: "Honda",
    model: "Fit",
    year: 2021,
    bodyType: "hatchback",
    currentMileageKm: 41_000,
    monthlyMileageKm: 1200,
    minAgeDays: 1500,
    parts: { "engine-oil": { status: "yellow" } },
  },
  {
    owner: "ownerOne",
    plate: "TWN-ORG",
    make: "Hyundai",
    model: "Tucson",
    year: 2020,
    bodyType: "suv",
    currentMileageKm: 73_000,
    monthlyMileageKm: 1500,
    minAgeDays: 2000,
    parts: { "brake-pads": { status: "orange" }, coolant: { status: "yellow", driver: "time" } },
  },
  {
    owner: "ownerOne",
    plate: "TWN-RED",
    make: "Toyota",
    model: "Hilux",
    year: 2019,
    bodyType: "pickup",
    currentMileageKm: 98_000,
    monthlyMileageKm: 2000,
    minAgeDays: 2500,
    parts: { tires: { status: "red" }, "engine-oil": { status: "orange" } },
  },
  {
    owner: "ownerOne",
    plate: "TWN-OVR",
    make: "Nissan",
    model: "Sentra",
    year: 2018,
    bodyType: "sedan",
    currentMileageKm: 54_000,
    monthlyMileageKm: 800,
    minAgeDays: 2900,
    // Few kilometers, but the battery is far past its time interval.
    parts: { battery: { status: "red", driver: "time" } },
  },
  {
    owner: "ownerTwo",
    plate: "TWN-OTH",
    make: "Kia",
    model: "Rio",
    year: 2023,
    bodyType: "hatchback",
    currentMileageKm: 9000,
    monthlyMileageKm: 1000,
    minAgeDays: 600,
    parts: {},
  },
];

/** Where in its interval a part sits for each status: the middle of the status band, or past it. */
const TARGET_RATIO: Record<HealthStatus, number> = { green: 0.1, yellow: 0.6, orange: 0.85, red: 1.25 };

/** Time intervals are expressed in months; a month counts as 30 days. */
const DAYS_PER_MONTH = 30;

/**
 * A baseline that puts `partId` at `status` for `today`, whatever day that is. The usage is the
 * greater of the km and time ratios, so the driver sets one to the target and keeps the other at
 * half of it. Parts tracked by time only always use the time driver.
 */
export function relativeBaseline(
  partId: PartId,
  status: HealthStatus,
  driver: PartDriver,
  currentMileageKm: number,
  today: CalendarDate,
): PartBaseline {
  const part = MAINTENANCE_CATALOG.find((candidate) => candidate.id === partId);
  if (!part) throw new RangeError(`Unknown part "${partId}"`);

  const ratio = TARGET_RATIO[status];
  const kmInterval = driver === "km" ? part.kmInterval : null;
  const intervalDays = part.monthInterval * DAYS_PER_MONTH;
  const elapsedDays = Math.round((kmInterval === null ? ratio : ratio / 2) * intervalDays);
  const elapsedKm = kmInterval === null ? 0 : Math.round(ratio * kmInterval);
  if (elapsedKm > currentMileageKm) {
    throw new RangeError(`A ${status} ${partId} needs at least ${elapsedKm} km on the odometer, not ${currentMileageKm}`);
  }
  return { partId, mileageKm: currentMileageKm - elapsedKm, date: addDays(today, -elapsedDays) };
}

export type SeedVehicleData = Omit<NewVehicle, "ownerId" | "baselines"> & { baselines: PartBaseline[] };

/** The vehicle as stored for `today`: eight relative baselines and a purchase date before all of them. */
export function buildSeedVehicle(spec: SeedVehicleSpec, today: CalendarDate): SeedVehicleData {
  const baselines = MAINTENANCE_CATALOG.map((part) => {
    const { status, driver = "km" } = spec.parts[part.id] ?? { status: "green" };
    return relativeBaseline(part.id, status, driver, spec.currentMileageKm, today);
  });
  const oldestBaselineDays = Math.max(...baselines.map((baseline) => daysBetween(baseline.date, today)));
  return {
    plate: spec.plate,
    make: spec.make,
    model: spec.model,
    year: spec.year,
    bodyType: spec.bodyType,
    currentMileageKm: spec.currentMileageKm,
    monthlyMileageKm: spec.monthlyMileageKm,
    purchaseDate: addDays(today, -Math.max(spec.minAgeDays, oldestBaselineDays + 30)),
    baselines,
  };
}

export interface ExpectedVehicleHealth {
  /** The worst part status. */
  overallStatus: HealthStatus;
  parts: Record<PartId, HealthStatus>;
  /** A red part is past its interval, so the next maintenance is due today. */
  nextMaintenanceOverdue: boolean;
}

function expectedHealth(spec: SeedVehicleSpec): ExpectedVehicleHealth {
  const parts = Object.fromEntries(
    MAINTENANCE_CATALOG.map((part) => [part.id, spec.parts[part.id]?.status ?? "green"]),
  ) as Record<PartId, HealthStatus>;
  const overallStatus = worstStatus(Object.values(parts));
  return { overallStatus, parts, nextMaintenanceOverdue: overallStatus === "red" };
}

/**
 * The statuses every seeded vehicle shows, by plate, on any day the seed runs. End-to-end tests
 * assert against this instead of hardcoding colors.
 */
export const SEED_EXPECTATIONS: Readonly<Record<string, ExpectedVehicleHealth>> = Object.fromEntries(
  SEED_VEHICLES.map((spec) => [spec.plate, expectedHealth(spec)]),
);
