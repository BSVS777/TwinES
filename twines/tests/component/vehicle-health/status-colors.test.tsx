import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CSS = readFileSync("src/app/globals.css", "utf8");
const STATUSES = ["green", "yellow", "orange", "red"] as const;

function variable(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(CSS);
  if (!match) throw new Error(`CSS variable --${name} is not defined in globals.css`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("status colors", () => {
  it.each(STATUSES)("VIEW-02 text on the %s status color meets WCAG AA (4.5:1)", (status) => {
    expect(contrast(variable(`status-${status}`), variable(`status-${status}-text`))).toBeGreaterThanOrEqual(4.5);
  });

  it("defines four distinct status colors", () => {
    expect(new Set(STATUSES.map((status) => variable(`status-${status}`))).size).toBe(4);
  });
});
