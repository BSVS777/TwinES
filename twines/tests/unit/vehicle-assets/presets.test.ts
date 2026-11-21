import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const PRESETS_DIR = fileURLToPath(new URL("../../../tools/blender/presets/", import.meta.url));
const BODY_TYPES = ["sedan", "hatchback", "suv", "pickup"];
const SOURCE_KINDS = ["parametric", "kenney"];
const EXPECTED_PLACEMENTS: Readonly<Record<string, number>> = { "engine-bay": 1, "wheel-brake": 4 };

type Json = Record<string, unknown>;

function presetFiles(): string[] {
  return existsSync(PRESETS_DIR)
    ? readdirSync(PRESETS_DIR).filter((name) => name.endsWith(".json"))
    : [];
}

function readPreset(file: string): Json {
  return JSON.parse(readFileSync(`${PRESETS_DIR}${file}`, "utf8")) as Json;
}

function numbersOf(value: unknown): number[] {
  return Object.values(value as Json) as number[];
}

const files = presetFiles();

describe("vehicle shell presets", () => {
  it("ASSET-35 ships at least the first shell preset (sedan-corolla)", () => {
    expect(files).toContain("sedan-corolla.json");
  });

  describe.each(files)("%s", (file) => {
    const preset = readPreset(file);

    it("ASSET-35 parses and its id equals the file name", () => {
      expect(preset.id).toBe(file.replace(/\.json$/, ""));
    });

    it("ASSET-35 declares a known body type and a known source kind", () => {
      expect(BODY_TYPES).toContain(preset.bodyType);
      expect(SOURCE_KINDS).toContain((preset.source as Json).kind);
    });

    it("ASSET-35 has finite dimensions and profile numbers", () => {
      for (const section of ["dimensions", "profile"]) {
        const values = numbersOf(preset[section]);
        expect(values.length).toBeGreaterThan(0);
        for (const value of values) {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    });

    it("ASSET-35 declares placements as {position, rotation, scale} 3-vectors", () => {
      const placements = preset.placements as Record<string, Json[]>;
      for (const [assembly, count] of Object.entries(EXPECTED_PLACEMENTS)) {
        expect(placements[assembly]).toHaveLength(count);
        for (const transform of placements[assembly]) {
          for (const key of ["position", "rotation", "scale"]) {
            const vector = transform[key] as number[];
            expect(vector).toHaveLength(3);
            expect(vector.every((component) => Number.isFinite(component))).toBe(true);
          }
        }
      }
    });
  });
});
