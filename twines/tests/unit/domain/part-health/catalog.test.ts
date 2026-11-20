import { describe, expect, it } from "vitest";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";

describe("MAINTENANCE_CATALOG", () => {
  it("HLT-01 contains exactly the 8 parts with the spec intervals", () => {
    expect(MAINTENANCE_CATALOG).toEqual([
      { id: "engine-oil", name: "Engine oil", kmInterval: 5000, monthInterval: 6 },
      { id: "oil-filter", name: "Oil filter", kmInterval: 5000, monthInterval: 6 },
      { id: "air-filter", name: "Air filter", kmInterval: 15000, monthInterval: 12 },
      { id: "brake-pads", name: "Brake pads", kmInterval: 30000, monthInterval: 24 },
      { id: "tires", name: "Tires", kmInterval: 50000, monthInterval: 48 },
      { id: "battery", name: "Battery", kmInterval: null, monthInterval: 36 },
      { id: "coolant", name: "Coolant", kmInterval: 40000, monthInterval: 24 },
      { id: "spark-plugs", name: "Spark plugs", kmInterval: 30000, monthInterval: 36 },
    ]);
  });

  it("HLT-01 tracks only the battery by time alone", () => {
    const timeOnly = MAINTENANCE_CATALOG.filter((part) => part.kmInterval === null);
    expect(timeOnly.map((part) => part.id)).toEqual(["battery"]);
  });

  it("HLT-01 has unique part ids", () => {
    const ids = MAINTENANCE_CATALOG.map((part) => part.id);
    expect(new Set(ids).size).toBe(8);
  });
});
