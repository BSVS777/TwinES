import type { Clock, PasswordHasher, PublicUser, Role, UserRepository, VehicleRepository } from "@/application/ports";
import { exceedsPasswordLimit, MAX_PASSWORD_BYTES } from "@/application/validation/auth";
import { SEED_EMAILS, SEED_VEHICLES, buildSeedVehicle } from "./seed-data";

export interface SeedDeps {
  users: UserRepository;
  vehicles: VehicleRepository;
  hasher: PasswordHasher;
  clock: Clock;
}

export interface SeedPasswords {
  technician: string;
  owner: string;
}

export interface SeedSummary {
  users: number;
  vehicles: number;
}

const MIN_PASSWORD_LENGTH = 8;

function readPassword(env: Record<string, string | undefined>, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is not set. Set it to a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (value.length < MIN_PASSWORD_LENGTH) throw new Error(`${name} must have at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (exceedsPasswordLimit(value)) throw new Error(`${name} must be at most ${MAX_PASSWORD_BYTES} bytes long.`);
  return value;
}

/** The seed accounts' passwords come from the environment only, so none is ever in the repository. */
export function readSeedPasswords(env: Record<string, string | undefined>): SeedPasswords {
  return {
    technician: readPassword(env, "SEED_TECH_PASSWORD"),
    owner: readPassword(env, "SEED_OWNER_PASSWORD"),
  };
}

const ROLE_LABEL: Record<Role, string> = { owner: "an owner", technician: "a technician" };

/** The account for `email`, created when missing. An existing account is kept as it is, password included. */
async function ensureUser({ users, hasher }: SeedDeps, email: string, role: Role, password: string): Promise<PublicUser> {
  const existing = await users.findByEmail(email);
  if (existing) {
    if (existing.role !== role) {
      throw new Error(`${email} is registered as ${ROLE_LABEL[existing.role]}, not ${ROLE_LABEL[role]}.`);
    }
    return { id: existing.id, email: existing.email, role: existing.role };
  }
  const created = await users.create({ email, passwordHash: await hasher.hash(password), role });
  return { id: created.id, email: created.email, role: created.role };
}

/**
 * Creates the technician, the two owners and the demo vehicles, with baselines measured back from
 * the clock's today so every status is on show whenever the seed runs. It can run any number of
 * times: accounts are found by email and kept, and each seed vehicle is found by plate and rebuilt
 * from scratch, which also undoes any edit made since. Other vehicles are never touched.
 */
export async function seedDatabase(deps: SeedDeps, passwords: SeedPasswords): Promise<SeedSummary> {
  const accounts = {
    technician: await ensureUser(deps, SEED_EMAILS.technician, "technician", passwords.technician),
    ownerOne: await ensureUser(deps, SEED_EMAILS.ownerOne, "owner", passwords.owner),
    ownerTwo: await ensureUser(deps, SEED_EMAILS.ownerTwo, "owner", passwords.owner),
  };

  const today = deps.clock.today();
  for (const spec of SEED_VEHICLES) {
    const owner = accounts[spec.owner];
    const existing = await deps.vehicles.findByPlate(spec.plate);
    if (existing) {
      if (existing.ownerId !== owner.id) {
        throw new Error(`Plate ${spec.plate} belongs to another account; the seed will not take it over.`);
      }
      await deps.vehicles.delete(existing.id);
    }
    await deps.vehicles.create({ ...buildSeedVehicle(spec, today), ownerId: owner.id });
  }

  return { users: Object.keys(accounts).length, vehicles: SEED_VEHICLES.length };
}
