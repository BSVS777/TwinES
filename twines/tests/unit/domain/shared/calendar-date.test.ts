import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  isCalendarDate,
  parseCalendarDate,
} from "@/domain/shared/calendar-date";

describe("parseCalendarDate", () => {
  it("accepts a valid YYYY-MM-DD date and returns it unchanged", () => {
    expect(parseCalendarDate("2026-03-15")).toBe("2026-03-15");
  });

  it("accepts a leap day only in leap years", () => {
    expect(parseCalendarDate("2028-02-29")).toBe("2028-02-29");
    expect(() => parseCalendarDate("2026-02-29")).toThrow(/2026-02-29/);
  });

  it.each(["2026-02-30", "2026-13-01", "2026-00-10", "2026-04-31", "2026-01-00"])(
    "rejects the impossible date %s",
    (value) => {
      expect(() => parseCalendarDate(value)).toThrow(/Invalid calendar date/);
    },
  );

  it.each(["", "2026-1-5", "26-01-05", "2026/01/05", "2026-01-05T00:00:00Z", " 2026-01-05"])(
    "rejects the wrongly formatted value %j",
    (value) => {
      expect(() => parseCalendarDate(value)).toThrow(/Invalid calendar date/);
    },
  );
});

describe("isCalendarDate", () => {
  it("is true for valid dates and false for invalid or malformed ones", () => {
    expect(isCalendarDate("2026-03-15")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("not a date")).toBe(false);
  });
});

describe("addDays", () => {
  const date = (value: string) => parseCalendarDate(value);

  it("adds days within a month", () => {
    expect(addDays(date("2026-03-10"), 5)).toBe("2026-03-15");
  });

  it("rolls over month and year ends", () => {
    expect(addDays(date("2026-01-31"), 1)).toBe("2026-02-01");
    expect(addDays(date("2026-12-31"), 1)).toBe("2027-01-01");
    expect(addDays(date("2026-12-15"), 30)).toBe("2027-01-14");
  });

  it("handles leap years", () => {
    expect(addDays(date("2028-02-28"), 1)).toBe("2028-02-29");
    expect(addDays(date("2026-02-28"), 1)).toBe("2026-03-01");
  });

  it("subtracts days when the amount is negative and keeps the date for zero", () => {
    expect(addDays(date("2026-03-01"), -1)).toBe("2026-02-28");
    expect(addDays(date("2027-01-01"), -1)).toBe("2026-12-31");
    expect(addDays(date("2026-03-01"), 0)).toBe("2026-03-01");
  });
});

describe("daysBetween", () => {
  const date = (value: string) => parseCalendarDate(value);

  it("counts whole days from the first date to the second", () => {
    expect(daysBetween(date("2026-03-01"), date("2026-03-31"))).toBe(30);
    expect(daysBetween(date("2026-03-15"), date("2026-03-15"))).toBe(0);
  });

  it("is negative when the second date is earlier", () => {
    expect(daysBetween(date("2026-03-31"), date("2026-03-01"))).toBe(-30);
  });

  it("counts across month and year ends and leap days", () => {
    expect(daysBetween(date("2025-12-31"), date("2026-01-01"))).toBe(1);
    expect(daysBetween(date("2028-02-28"), date("2028-03-01"))).toBe(2);
    expect(daysBetween(date("2026-02-28"), date("2026-03-01"))).toBe(1);
    expect(daysBetween(date("2026-01-01"), date("2027-01-01"))).toBe(365);
  });

  it("is the inverse of addDays", () => {
    const start = date("2026-02-14");
    expect(daysBetween(start, addDays(start, 540))).toBe(540);
  });
});
