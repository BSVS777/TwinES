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

/**
 * Real clock. `today()` is the calendar date in Costa Rica. Outside production,
 * `TWINES_FIXED_TODAY` pins it so color statuses and tests are reproducible.
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
    if (fixed && this.env.NODE_ENV !== "production") return parseCalendarDate(fixed);
    return parseCalendarDate(dateFormat.format(this.now()));
  }
}
