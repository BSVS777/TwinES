import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("next.config", () => {
  it("AUTH-15 enables authInterrupts so wrong-role pages can answer a real 403 through forbidden()", () => {
    expect(nextConfig.experimental?.authInterrupts).toBe(true);
  });
});
