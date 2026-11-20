import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { HealthStatus } from "@/domain/part-health/health-estimator";
import { STATUS_COLOR, hotspotAppearance } from "@/components/vehicle-health/status-colors";

const CSS = readFileSync("src/app/globals.css", "utf8");
const STATUSES: readonly HealthStatus[] = ["green", "yellow", "orange", "red"];

function cssColor(status: HealthStatus): string {
  const match = new RegExp(`--status-${status}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(CSS);
  if (!match) throw new Error(`--status-${status} is not defined in globals.css`);
  return match[1].toLowerCase();
}

describe("3D status colors", () => {
  it.each(STATUSES)("VIEW-02 the %s hotspot color matches its --status CSS variable", (status) => {
    expect(STATUS_COLOR[status].toLowerCase()).toBe(cssColor(status));
  });

  it("defines exactly the four statuses", () => {
    expect(Object.keys(STATUS_COLOR).sort()).toEqual([...STATUSES].sort());
  });
});

describe("hotspotAppearance", () => {
  it("VIEW-05 uses the status color and a glow for the selected part only", () => {
    const idle = hotspotAppearance("red", false);
    const selected = hotspotAppearance("red", true);

    expect(idle.color).toBe(STATUS_COLOR.red);
    expect(selected.color).toBe(STATUS_COLOR.red);
    expect(selected.scale).toBeGreaterThan(idle.scale);
    expect(selected.emissiveIntensity).toBeGreaterThan(idle.emissiveIntensity);
  });

  it("keeps each status color when highlighted", () => {
    for (const status of STATUSES) expect(hotspotAppearance(status, true).color).toBe(STATUS_COLOR[status]);
  });
});
