/** A calendar day without a time or zone, formatted as "YYYY-MM-DD". */
export type CalendarDate = string & { readonly __brand: "CalendarDate" };

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function toUtcMs(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
}

function isValidParts(year: number, month: number, day: number): boolean {
  const date = new Date(toUtcMs(year, month, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** True when the value is a real calendar date written as "YYYY-MM-DD". */
export function isCalendarDate(value: string): value is CalendarDate {
  const match = FORMAT.exec(value);
  if (!match) return false;
  return isValidParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** Validates and brands a "YYYY-MM-DD" string; throws on impossible or malformed dates. */
export function parseCalendarDate(value: string): CalendarDate {
  if (!isCalendarDate(value)) {
    throw new RangeError(`Invalid calendar date: "${value}" (expected a real YYYY-MM-DD date)`);
  }
  return value;
}

function toMs(date: CalendarDate): number {
  const [year, month, day] = date.split("-").map(Number);
  return toUtcMs(year, month, day);
}

/** Returns the date `days` days after `date` (before it when negative). */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const result = new Date(toMs(date) + days * MS_PER_DAY);
  const year = String(result.getUTCFullYear()).padStart(4, "0");
  const month = String(result.getUTCMonth() + 1).padStart(2, "0");
  const day = String(result.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as CalendarDate;
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.round((toMs(to) - toMs(from)) / MS_PER_DAY);
}
