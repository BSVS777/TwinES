import { describe, expect, it } from "vitest";
import type { BodyType } from "@/application/ports";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import { getBodyModel } from "@/components/vehicle-health/models";
import type { BodyModel, Box, Vec3 } from "@/components/vehicle-health/models/types";

const BODY_TYPES: readonly BodyType[] = ["sedan", "hatchback", "suv", "pickup"];
const PART_IDS = MAINTENANCE_CATALOG.map((part) => part.id);

/** x is the length of the vehicle (front at +x), y is up, z is the width. */
function topOf(box: Box): number {
  return box.position[1] + box.size[1] / 2;
}

function frontOf(box: Box): number {
  return box.position[0] + box.size[0] / 2;
}

function key(position: Vec3): string {
  return position.join(",");
}

describe("vehicle body models", () => {
  it.each(BODY_TYPES)("VIEW-03 maps the %s body type to its own model", (bodyType) => {
    expect(getBodyModel(bodyType).bodyType).toBe(bodyType);
  });

  it("VIEW-03 gives each body type a distinct silhouette", () => {
    const silhouettes = BODY_TYPES.map((bodyType) => {
      const model = getBodyModel(bodyType);
      return JSON.stringify([model.body, model.cabin, model.wheels]);
    });

    expect(new Set(silhouettes).size).toBe(BODY_TYPES.length);
  });

  it("VIEW-03 the pickup is longer than the hatchback and the SUV is taller than the sedan", () => {
    expect(getBodyModel("pickup").body.size[0]).toBeGreaterThan(getBodyModel("hatchback").body.size[0]);
    expect(topOf(getBodyModel("suv").cabin)).toBeGreaterThan(topOf(getBodyModel("sedan").cabin));
  });

  describe.each(BODY_TYPES)("%s hotspots", (bodyType) => {
    const model: BodyModel = getBodyModel(bodyType);

    it("has a hotspot for each of the 8 tracked parts and nothing else", () => {
      expect(Object.keys(model.hotspots).sort()).toEqual([...PART_IDS].sort());
    });

    it("places every hotspot at its own position", () => {
      const positions = Object.values(model.hotspots).map(key);

      expect(new Set(positions).size).toBe(8);
    });

    it("keeps every hotspot position finite", () => {
      for (const position of Object.values(model.hotspots)) {
        expect(position).toHaveLength(3);
        expect(position.every(Number.isFinite)).toBe(true);
      }
    });

    it("puts the engine bay parts on the hood, above the body and ahead of the cabin", () => {
      for (const partId of ["engine-oil", "oil-filter", "air-filter", "spark-plugs", "coolant", "battery"] as const) {
        const [x, y] = model.hotspots[partId];
        expect(x).toBeGreaterThan(frontOf(model.cabin));
        expect(x).toBeLessThan(frontOf(model.body));
        expect(y).toBeGreaterThan(topOf(model.body));
      }
    });

    it("puts the tires on a rear wheel and the brake pads at a front wheel hub, outside the body", () => {
      const rearWheels = model.wheels.filter(([x]) => x < 0);
      const frontWheels = model.wheels.filter(([x]) => x > 0);
      const [tiresX, , tiresZ] = model.hotspots.tires;
      const [padsX, , padsZ] = model.hotspots["brake-pads"];

      expect(rearWheels.map(([x]) => x)).toContain(tiresX);
      expect(frontWheels.map(([x]) => x)).toContain(padsX);
      expect(Math.abs(tiresZ)).toBeGreaterThan(model.body.size[2] / 2);
      expect(Math.abs(padsZ)).toBeGreaterThan(model.body.size[2] / 2);
    });

    it("has four wheels resting on the ground", () => {
      expect(model.wheels).toHaveLength(4);
      for (const [, y] of model.wheels) expect(y).toBe(model.wheelRadius);
    });
  });
});
