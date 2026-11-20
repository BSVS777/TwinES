import { describe, expect, it } from "vitest";
import { SystemClock } from "@/infrastructure/auth/clock";

const at = (iso: string) => () => new Date(iso);

describe("SystemClock", () => {
  it("returns the current instant from now()", () => {
    const clock = new SystemClock({}, at("2026-03-10T12:00:00Z"));

    expect(clock.now()).toEqual(new Date("2026-03-10T12:00:00Z"));
  });

  it("returns the calendar date in America/Costa_Rica (UTC-6), not the UTC date", () => {
    expect(new SystemClock({}, at("2026-11-20T05:59:59Z")).today()).toBe("2026-11-19");
    expect(new SystemClock({}, at("2026-11-20T06:00:00Z")).today()).toBe("2026-11-20");
  });

  it("honors TWINES_FIXED_TODAY outside production", () => {
    const env = { NODE_ENV: "test", TWINES_FIXED_TODAY: "2026-06-15" };

    expect(new SystemClock(env, at("2026-11-20T06:00:00Z")).today()).toBe("2026-06-15");
    expect(new SystemClock({ TWINES_FIXED_TODAY: "2026-06-15" }, at("2026-11-20T06:00:00Z")).today()).toBe(
      "2026-06-15",
    );
  });

  it("ignores TWINES_FIXED_TODAY in production", () => {
    const env = { NODE_ENV: "production", TWINES_FIXED_TODAY: "2026-06-15" };

    expect(new SystemClock(env, at("2026-11-20T06:00:00Z")).today()).toBe("2026-11-20");
  });

  it("fails loudly on a malformed fixed date instead of falling back silently", () => {
    const env = { NODE_ENV: "test", TWINES_FIXED_TODAY: "15/06/2026" };

    expect(() => new SystemClock(env, at("2026-11-20T06:00:00Z")).today()).toThrow(RangeError);
  });

  it("treats an empty TWINES_FIXED_TODAY as unset", () => {
    const env = { NODE_ENV: "test", TWINES_FIXED_TODAY: "" };

    expect(new SystemClock(env, at("2026-11-20T06:00:00Z")).today()).toBe("2026-11-20");
  });
});
