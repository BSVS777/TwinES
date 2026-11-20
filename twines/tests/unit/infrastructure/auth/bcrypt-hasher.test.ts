import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-hasher";

// Cost 4 is the bcrypt minimum; it keeps these tests fast while exercising the real algorithm.
const hasher = new BcryptPasswordHasher(4);

describe("BcryptPasswordHasher", () => {
  it("AUTH-05 produces a salted bcrypt hash that differs from the plain password", async () => {
    const hash = await hasher.hash("secret123");

    expect(hash).not.toBe("secret123");
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
  });

  it("uses a fresh salt on every call", async () => {
    expect(await hasher.hash("secret123")).not.toBe(await hasher.hash("secret123"));
  });

  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hasher.hash("secret123");

    expect(await hasher.verify("secret123", hash)).toBe(true);
    expect(await hasher.verify("secret124", hash)).toBe(false);
  });

  it("uses cost 12 by default", async () => {
    const hash = await new BcryptPasswordHasher().hash("secret123");

    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });
});
