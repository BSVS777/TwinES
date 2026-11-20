import { z } from "zod";
import type { BodyType } from "@/application/ports";
import { MAINTENANCE_CATALOG, type PartId } from "@/domain/part-health/catalog";
import { daysBetween, isCalendarDate, type CalendarDate } from "@/domain/shared/calendar-date";

const PLATE_MAX = 8;
const NAME_MAX = 50;
const FIRST_MODEL_YEAR = 1990;
const MILEAGE_MAX = 1_000_000;
const MONTHLY_MILEAGE_MAX = 10_000;
const DEFAULT_MONTHLY_MILEAGE = 1000;

const BODY_TYPES = ["sedan", "hatchback", "suv", "pickup"] as const satisfies readonly BodyType[];
const PART_IDS = MAINTENANCE_CATALOG.map((part) => part.id) as [PartId, ...PartId[]];

const formatNumber = (value: number) => value.toLocaleString("en-US");

/** A missing value reads "X is required"; a wrong type reads with the `invalid` wording. */
function required(requiredMessage: string, invalid = requiredMessage) {
  return { error: (issue: { input?: unknown }) => (issue.input === undefined ? requiredMessage : invalid) };
}

function text(label: string, max: number) {
  return z
    .string(required(`${label} is required`))
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

/** A whole number within bounds; `label` names it in every message. */
function wholeNumber(label: string, min: number, max: number) {
  return z
    .number(required(`${label} is required`, `${label} must be a whole number`))
    .int(`${label} must be a whole number`)
    .min(min, `${label} cannot be negative`)
    .max(max, `${label} cannot be more than ${formatNumber(max)} km`);
}

/** A real "YYYY-MM-DD" date that is not after `today`. */
function pastOrTodayDate(label: string, today: CalendarDate) {
  return z
    .string(required(`${label} is required`, `${label} must be a real date written as YYYY-MM-DD`))
    .refine(isCalendarDate, {
      error: `${label} must be a real date written as YYYY-MM-DD`,
      abort: true,
    })
    .refine((value) => daysBetween(value, today) >= 0, { error: `${label} cannot be in the future` })
    .transform((value) => value as CalendarDate);
}

/** Registration fields without the monthly-mileage default, shared by registration and edits. */
function vehicleFields(today: CalendarDate) {
  const latestYear = Number(today.slice(0, 4)) + 1;
  return {
    plate: z
      .string(required("Plate is required"))
      .trim()
      .toUpperCase()
      .min(1, "Plate is required")
      .max(PLATE_MAX, `Plate must be at most ${PLATE_MAX} characters`)
      .regex(/^[A-Z0-9-]+$/, "Plate can only have letters, digits and hyphens"),
    make: text("Make", NAME_MAX),
    model: text("Model", NAME_MAX),
    year: z
      .number(required("Year is required", "Year must be a whole number"))
      .int("Year must be a whole number")
      .min(FIRST_MODEL_YEAR, `Year must be ${FIRST_MODEL_YEAR} or later`)
      .max(latestYear, `Year must be ${latestYear} or earlier`),
    bodyType: z.enum(BODY_TYPES, required("Body type is required", "Body type must be sedan, hatchback, suv or pickup")),
    currentMileageKm: wholeNumber("Mileage", 0, MILEAGE_MAX),
    purchaseDate: pastOrTodayDate("Purchase date", today),
    monthlyMileageKm: wholeNumber("Monthly mileage", 0, MONTHLY_MILEAGE_MAX),
  };
}

const INVALID_INPUT = { error: "Invalid input" };

/**
 * Vehicle registration input (VEH-03, VEH-04). Built per request because the latest model year
 * and the "not in the future" date both depend on today's date, which comes from the Clock.
 * Unknown keys, `ownerId` included, are dropped.
 */
export function vehicleSchema(today: CalendarDate) {
  const fields = vehicleFields(today);
  return z.object(
    { ...fields, monthlyMileageKm: fields.monthlyMileageKm.default(DEFAULT_MONTHLY_MILEAGE) },
    INVALID_INPUT,
  );
}

/**
 * Vehicle edit input: any subset of the registration fields under the same rules. Omitted fields
 * stay omitted, so an edit never resets the monthly mileage to its registration default.
 */
export function vehicleUpdateSchema(today: CalendarDate) {
  return z.object(vehicleFields(today), INVALID_INPUT).partial();
}

/**
 * A part's service baseline (VEH-06, VEH-07). Whether the mileage exceeds the vehicle's current
 * mileage depends on the vehicle, so the use case checks that.
 */
export function baselineSchema(today: CalendarDate) {
  return z.object(
    {
      partId: z.enum(PART_IDS, required("Part is required", "Part must be one of the 8 tracked parts")),
      mileageKm: wholeNumber("Mileage", 0, MILEAGE_MAX),
      date: pastOrTodayDate("Date", today),
    },
    INVALID_INPUT,
  );
}

export type VehicleInput = z.infer<ReturnType<typeof vehicleSchema>>;
export type VehicleUpdateInput = z.infer<ReturnType<typeof vehicleUpdateSchema>>;
export type BaselineInput = z.infer<ReturnType<typeof baselineSchema>>;
