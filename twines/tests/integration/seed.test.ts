import { beforeEach, describe, expect, it } from "vitest";
import type { Clock } from "@/application/ports";
import { getVehicleHealth } from "@/application/vehicles/get-vehicle-health";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import { parseCalendarDate } from "@/domain/shared/calendar-date";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-hasher";
import { createContainer } from "@/infrastructure/container";
import { getDb } from "@/infrastructure/db";
import { SEED_EMAILS, SEED_EXPECTATIONS, SEED_VEHICLES } from "../../prisma/seed-data";
import { seedDatabase, type SeedDeps } from "../../prisma/seed-database";
import { resetDatabase } from "./helpers";

const PASSWORDS = { technician: "tech-pass-1", owner: "owner-pass-1" };
// A low bcrypt cost keeps the run fast; the seed uses whatever hasher it is given.
const hasher = new BcryptPasswordHasher(4);

function clockAt(date: string): Clock {
  const today = parseCalendarDate(date);
  return { today: () => today, now: () => new Date(`${date}T12:00:00Z`) };
}

function depsAt(date: string): SeedDeps {
  return { ...createContainer(getDb()), hasher, clock: clockAt(date) };
}

const db = getDb();

beforeEach(resetDatabase);

describe("seedDatabase", () => {
  it("creates the technician, two owners and every seed vehicle with eight baselines", async () => {
    const summary = await seedDatabase(depsAt("2026-11-20"), PASSWORDS);

    expect(summary).toEqual({ users: 3, vehicles: SEED_VEHICLES.length });
    const users = await db.user.findMany({ orderBy: { email: "asc" } });
    expect(users.map((user) => [user.email, user.role])).toEqual([
      [SEED_EMAILS.ownerOne, "owner"],
      [SEED_EMAILS.ownerTwo, "owner"],
      [SEED_EMAILS.technician, "technician"],
    ]);
    expect(await db.vehicle.count()).toBe(SEED_VEHICLES.length);
    expect(await db.partBaseline.count()).toBe(SEED_VEHICLES.length * MAINTENANCE_CATALOG.length);
  });

  it("hashes the passwords with the real hasher and never stores them", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);

    const technician = await db.user.findUniqueOrThrow({ where: { email: SEED_EMAILS.technician } });
    const owner = await db.user.findUniqueOrThrow({ where: { email: SEED_EMAILS.ownerOne } });
    expect(await hasher.verify(PASSWORDS.technician, technician.passwordHash)).toBe(true);
    expect(await hasher.verify(PASSWORDS.owner, owner.passwordHash)).toBe(true);
    expect(await hasher.verify(PASSWORDS.owner, technician.passwordHash)).toBe(false);
    expect(technician.passwordHash).not.toContain(PASSWORDS.technician);
  });

  it("owns the vehicles as the specs say: owner one the five, owner two the other", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);

    for (const spec of SEED_VEHICLES) {
      const vehicle = await db.vehicle.findUniqueOrThrow({ where: { plate: spec.plate }, include: { owner: true } });
      expect(vehicle.owner.email).toBe(SEED_EMAILS[spec.owner]);
    }
  });

  it("is idempotent: running it again duplicates nothing and keeps the accounts", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);
    const before = await db.user.findMany({ orderBy: { email: "asc" } });

    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);

    expect(await db.user.findMany({ orderBy: { email: "asc" } })).toEqual(before);
    expect(await db.vehicle.count()).toBe(SEED_VEHICLES.length);
    expect(await db.partBaseline.count()).toBe(SEED_VEHICLES.length * MAINTENANCE_CATALOG.length);
  });

  it("shows every expected status through the real health use case", async () => {
    const deps = depsAt("2026-11-20");
    await seedDatabase(deps, PASSWORDS);

    for (const spec of SEED_VEHICLES) {
      const stored = await db.vehicle.findUniqueOrThrow({ where: { plate: spec.plate } });
      const technician = { id: "t", email: SEED_EMAILS.technician, role: "technician" as const };
      const result = await getVehicleHealth(deps, technician, stored.id);
      const expected = SEED_EXPECTATIONS[spec.plate];

      expect(result.overallStatus, spec.plate).toBe(expected.overallStatus);
      expect(result.nextMaintenance.overdue, spec.plate).toBe(expected.nextMaintenanceOverdue);
      for (const part of result.health) expect(part.status, `${spec.plate} ${part.partId}`).toBe(expected.parts[part.partId]);
    }
  });

  it("re-anchors the statuses to a later day when it runs again", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);
    const later = depsAt("2027-05-03");

    await seedDatabase(later, PASSWORDS);

    for (const spec of SEED_VEHICLES) {
      const stored = await db.vehicle.findUniqueOrThrow({ where: { plate: spec.plate } });
      const technician = { id: "t", email: SEED_EMAILS.technician, role: "technician" as const };
      const result = await getVehicleHealth(later, technician, stored.id);
      expect(result.overallStatus, spec.plate).toBe(SEED_EXPECTATIONS[spec.plate].overallStatus);
    }
  });

  it("restores a seed vehicle that was changed since, including a raised mileage", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);
    const plate = SEED_VEHICLES[0].plate;
    await db.vehicle.update({ where: { plate }, data: { currentMileageKm: 999_000, make: "Changed" } });

    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);

    const restored = await db.vehicle.findUniqueOrThrow({ where: { plate } });
    expect(restored.currentMileageKm).toBe(SEED_VEHICLES[0].currentMileageKm);
    expect(restored.make).toBe(SEED_VEHICLES[0].make);
  });

  it("leaves vehicles that are not part of the seed alone", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);
    const owner = await db.user.findUniqueOrThrow({ where: { email: SEED_EMAILS.ownerOne } });
    await db.vehicle.create({
      data: {
        ownerId: owner.id,
        plate: "MINE-1",
        make: "Own",
        model: "Car",
        year: 2020,
        bodyType: "sedan",
        currentMileageKm: 1000,
        purchaseDate: "2020-01-01",
        monthlyMileageKm: 1000,
      },
    });

    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);

    expect(await db.vehicle.count({ where: { plate: "MINE-1" } })).toBe(1);
  });

  it("refuses to take over a seed plate that belongs to another account", async () => {
    const stranger = await db.user.create({ data: { email: "stranger@example.com", passwordHash: "x", role: "owner" } });
    await db.vehicle.create({
      data: {
        ownerId: stranger.id,
        plate: SEED_VEHICLES[0].plate,
        make: "Own",
        model: "Car",
        year: 2020,
        bodyType: "sedan",
        currentMileageKm: 1000,
        purchaseDate: "2020-01-01",
        monthlyMileageKm: 1000,
      },
    });

    await expect(seedDatabase(depsAt("2026-11-20"), PASSWORDS)).rejects.toThrow(/belongs to another account/);

    expect((await db.vehicle.findUniqueOrThrow({ where: { plate: SEED_VEHICLES[0].plate } })).make).toBe("Own");
  });

  it("refuses an existing seed email that has a different role", async () => {
    await db.user.create({ data: { email: SEED_EMAILS.technician, passwordHash: "x", role: "owner" } });

    await expect(seedDatabase(depsAt("2026-11-20"), PASSWORDS)).rejects.toThrow(/is registered as an owner, not a technician/);
  });

  it("keeps an existing account's password untouched", async () => {
    await seedDatabase(depsAt("2026-11-20"), PASSWORDS);
    const before = await db.user.findUniqueOrThrow({ where: { email: SEED_EMAILS.technician } });

    await seedDatabase(depsAt("2026-11-20"), { technician: "another-pass-9", owner: "owner-pass-1" });

    const after = await db.user.findUniqueOrThrow({ where: { email: SEED_EMAILS.technician } });
    expect(after.passwordHash).toBe(before.passwordHash);
  });
});
