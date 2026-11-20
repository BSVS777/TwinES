import { randomBytes } from "node:crypto";
import { SEED_EMAILS } from "../../../prisma/seed-data";

export interface Account {
  email: string;
  password: string;
}

function fromEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; run the suite through "npm run test:e2e".`);
  return value;
}

/** The seeded technician. The password is random per run and comes from the environment. */
export function technicianAccount(): Account {
  return { email: SEED_EMAILS.technician, password: fromEnvironment("E2E_TECH_PASSWORD") };
}

/** The seeded owner with the demo vehicles (read-only for the tests). */
export function seedOwnerAccount(): Account {
  return { email: SEED_EMAILS.ownerOne, password: fromEnvironment("E2E_OWNER_PASSWORD") };
}

/** A password that satisfies the sign-up rule (8+ characters, a letter and a digit). */
export function randomPassword(): string {
  return `Tw1-${randomBytes(9).toString("base64url")}`;
}

/** A throwaway email, so tests that fail sign-ins or lock accounts never touch a seed account. */
export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}.${randomBytes(4).toString("hex")}@example.com`;
}

/** A unique plate of 7 characters (the limit is 8), uppercase letters and digits. */
export function uniquePlate(): string {
  return `E${randomBytes(3).toString("hex").toUpperCase()}`;
}
