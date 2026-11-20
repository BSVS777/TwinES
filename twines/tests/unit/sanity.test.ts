import { describe, expect, it } from "vitest";
import { APP_NAME, getAppTitle } from "@/lib/app-info";

describe("test runner sanity", () => {
  it("exposes the application name", () => {
    expect(APP_NAME).toBe("TwinES");
  });

  it("builds a page title from a section name", () => {
    expect(getAppTitle("Vehicles")).toBe("Vehicles | TwinES");
  });

  it("falls back to the bare application name without a section", () => {
    expect(getAppTitle()).toBe("TwinES");
  });
});
