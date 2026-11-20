import { describe, expect, it } from "vitest";
import { CryptoSessionTokens } from "@/infrastructure/auth/session-token";

const tokens = new CryptoSessionTokens();

describe("CryptoSessionTokens", () => {
  it("generates a 32-byte token encoded as unpadded base64url", () => {
    const token = tokens.generate();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("never repeats", () => {
    const generated = new Set(Array.from({ length: 200 }, () => tokens.generate()));

    expect(generated.size).toBe(200);
  });

  it("hashes with SHA-256 as lowercase hex, deterministically", () => {
    expect(tokens.hash("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(tokens.hash("abc")).toBe(tokens.hash("abc"));
    expect(tokens.hash("abd")).not.toBe(tokens.hash("abc"));
  });

  it("does not contain the raw token in its hash", () => {
    const token = tokens.generate();

    expect(tokens.hash(token)).not.toContain(token);
  });
});
