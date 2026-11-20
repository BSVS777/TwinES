import type { Clock } from "@/application/ports";
import { parseCalendarDate, type CalendarDate } from "@/domain/shared/calendar-date";

const TIME_ZONE = "America/Costa_Rica";

// The "en-CA" locale formats dates as YYYY-MM-DD.
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `TWINES_FIXED_TODAY` is honored only in these environments, so production can never be pinned. */
const FIXED_TODAY_ENVIRONMENTS = ["development", "test"];

/**
 * Real clock. `today()` is the calendar date in Costa Rica. `TWINES_FIXED_TODAY` pins it so
 * color statuses and tests are reproducible, but only when `NODE_ENV` is exactly `development`
 * or `test`; any other value, or none, ignores it.
 */
export class SystemClock implements Clock {
  constructor(
    private readonly env: Record<string, string | undefined> = process.env,
    private readonly currentTime: () => Date = () => new Date(),
  ) {}

  now(): Date {
    return this.currentTime();
  }

  today(): CalendarDate {
    const fixed = this.env.TWINES_FIXED_TODAY;
    if (fixed && FIXED_TODAY_ENVIRONMENTS.includes(this.env.NODE_ENV ?? "")) return parseCalendarDate(fixed);
    return parseCalendarDate(dateFormat.format(this.now()));
  }
}
