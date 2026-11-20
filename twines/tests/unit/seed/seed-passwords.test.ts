import { describe, expect, it } from "vitest";
import { readSeedPasswords } from "../../../prisma/seed-database";

const VALID = { SEED_TECH_PASSWORD: "tech-pass-1", SEED_OWNER_PASSWORD: "owner-pass-1" };

describe("readSeedPasswords", () => {
  it("returns the technician and owner passwords from the environment", () => {
    expect(readSeedPasswords(VALID)).toEqual({ technician: "tech-pass-1", owner: "owner-pass-1" });
  });

  it.each(["SEED_TECH_PASSWORD", "SEED_OWNER_PASSWORD"])("fails fast, naming %s, when it is missing", (name) => {
    const env: Record<string, string | undefined> = { ...VALID };
    delete env[name];

    expect(() => readSeedPasswords(env)).toThrow(new RegExp(`${name} is not set`));
  });

  it.each(["SEED_TECH_PASSWORD", "SEED_OWNER_PASSWORD"])("treats an empty %s as missing", (name) => {
    expect(() => readSeedPasswords({ ...VALID, [name]: "" })).toThrow(new RegExp(`${name} is not set`));
  });

  it.each(["SEED_TECH_PASSWORD", "SEED_OWNER_PASSWORD"])("fails fast when %s has fewer than 8 characters", (name) => {
    expect(() => readSeedPasswords({ ...VALID, [name]: "short-7" })).toThrow(new RegExp(`${name} must have at least 8 characters`));
  });

  it("accepts exactly 8 characters", () => {
    expect(readSeedPasswords({ ...VALID, SEED_TECH_PASSWORD: "12345678" }).technician).toBe("12345678");
  });

  it.each(["SEED_TECH_PASSWORD", "SEED_OWNER_PASSWORD"])("fails fast when %s is over the 72-byte hashing limit", (name) => {
    expect(() => readSeedPasswords({ ...VALID, [name]: "x".repeat(73) })).toThrow(new RegExp(`${name} must be at most 72 bytes`));
  });

  it("never puts a password in the error message", () => {
    const secret = "short-7";

    expect(() => readSeedPasswords({ ...VALID, SEED_OWNER_PASSWORD: secret })).not.toThrow(new RegExp(secret));
  });
});
