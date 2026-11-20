import { describe, expect, it } from "vitest";
import type { HealthStatus } from "@/domain/part-health/health-estimator";
import { statusForRatio, worstStatus } from "@/domain/part-health/status";

describe("statusForRatio", () => {
  it.each<[number, HealthStatus]>([
    [0, "green"],
    [0.4999, "green"],
    [0.5, "yellow"],
    [0.7499, "yellow"],
    [0.75, "orange"],
    [0.9999, "orange"],
    [1.0, "red"],
    [2.5, "red"],
  ])("HLT-06 maps ratio %s to %s (lower bounds inclusive)", (ratio, expected) => {
    expect(statusForRatio(ratio)).toBe(expected);
  });
});

describe("worstStatus", () => {
  it("HLT-09 returns orange for 6 green, 1 yellow and 1 orange parts", () => {
    const statuses: HealthStatus[] = [
      "green", "green", "green", "green", "green", "green", "yellow", "orange",
    ];
    expect(worstStatus(statuses)).toBe("orange");
  });

  it("HLT-09 ranks red above orange, yellow and green regardless of order", () => {
    expect(worstStatus(["red", "green", "orange"])).toBe("red");
    expect(worstStatus(["green", "orange", "red"])).toBe("red");
    expect(worstStatus(["green", "yellow"])).toBe("yellow");
    expect(worstStatus(["green", "green"])).toBe("green");
  });

  it("HLT-09 treats an empty list as green", () => {
    expect(worstStatus([])).toBe("green");
  });
});
