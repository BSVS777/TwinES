import { beforeEach, describe, expect, it } from "vitest";
import { Conflict } from "@/application/errors";
import { getDb } from "@/infrastructure/db";
import { PrismaLoginThrottleStore } from "@/infrastructure/repositories/login-throttle-repository";
import { PrismaSessionStore } from "@/infrastructure/repositories/session-repository";
import { PrismaUserRepository } from "@/infrastructure/repositories/user-repository";
import { resetDatabase } from "./helpers";

const users = new PrismaUserRepository(getDb());
const sessions = new PrismaSessionStore(getDb());
const throttles = new PrismaLoginThrottleStore(getDb());

const newUser = { email: "ana@example.com", passwordHash: "hash-1", role: "owner" } as const;

beforeEach(resetDatabase);

describe("PrismaUserRepository", () => {
  it("creates a user and returns it with an id and creation time", async () => {
    const user = await users.create(newUser);

    expect(user).toMatchObject({ email: "ana@example.com", passwordHash: "hash-1", role: "owner" });
    expect(user.id).toEqual(expect.any(String));
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a duplicate email with Conflict naming the email field", async () => {
    await users.create(newUser);

    const duplicate = users.create({ ...newUser, passwordHash: "hash-2" });

    await expect(duplicate).rejects.toBeInstanceOf(Conflict);
    await expect(duplicate).rejects.toMatchObject({ field: "email" });
  });

  it("finds a user by email and by id, and returns null when missing", async () => {
    const created = await users.create({ ...newUser, role: "technician" });

    expect(await users.findByEmail("ana@example.com")).toEqual(created);
    expect(await users.findById(created.id)).toEqual(created);
    expect(await users.findByEmail("nobody@example.com")).toBeNull();
    expect(await users.findById("missing-id")).toBeNull();
  });
});

describe("PrismaSessionStore", () => {
  const now = new Date("2026-11-19T12:00:00.000Z");
  const inOneHour = new Date("2026-11-19T13:00:00.000Z");

  it("returns the owner of a live session looked up by token hash", async () => {
    const user = await users.create(newUser);
    await sessions.create({ tokenHash: "a".repeat(64), userId: user.id, expiresAt: inOneHour });

    expect(await sessions.findUserByTokenHash("a".repeat(64), now)).toEqual(user);
  });

  it("does not return a session that is expired or unknown", async () => {
    const user = await users.create(newUser);
    await sessions.create({ tokenHash: "expired", userId: user.id, expiresAt: now });
    await sessions.create({ tokenHash: "stale", userId: user.id, expiresAt: new Date("2026-11-18T00:00:00.000Z") });

    expect(await sessions.findUserByTokenHash("expired", now)).toBeNull();
    expect(await sessions.findUserByTokenHash("stale", now)).toBeNull();
    expect(await sessions.findUserByTokenHash("unknown", now)).toBeNull();
  });

  it("invalidates a session on delete and ignores unknown hashes", async () => {
    const user = await users.create(newUser);
    await sessions.create({ tokenHash: "to-delete", userId: user.id, expiresAt: inOneHour });
    await sessions.create({ tokenHash: "to-keep", userId: user.id, expiresAt: inOneHour });

    await sessions.deleteByTokenHash("to-delete");
    await sessions.deleteByTokenHash("never-existed");

    expect(await sessions.findUserByTokenHash("to-delete", now)).toBeNull();
    expect(await sessions.findUserByTokenHash("to-keep", now)).toEqual(user);
  });
});

describe("PrismaLoginThrottleStore", () => {
  it("returns null when an email has no failed attempts", async () => {
    expect(await throttles.find("ana@example.com")).toBeNull();
  });

  it("creates the record on first save and replaces it on the next", async () => {
    const lockedUntil = new Date("2026-11-19T12:15:00.000Z");

    await throttles.save({ email: "ana@example.com", failedCount: 1, lockedUntil: null });
    expect(await throttles.find("ana@example.com")).toEqual({
      email: "ana@example.com",
      failedCount: 1,
      lockedUntil: null,
    });

    await throttles.save({ email: "ana@example.com", failedCount: 5, lockedUntil });
    expect(await throttles.find("ana@example.com")).toEqual({
      email: "ana@example.com",
      failedCount: 5,
      lockedUntil,
    });
  });

  it("tracks emails that have no account", async () => {
    await throttles.save({ email: "ghost@example.com", failedCount: 2, lockedUntil: null });

    expect(await users.findByEmail("ghost@example.com")).toBeNull();
    expect((await throttles.find("ghost@example.com"))?.failedCount).toBe(2);
  });

  it("resets one email without touching others, and tolerates a missing record", async () => {
    await throttles.save({ email: "ana@example.com", failedCount: 3, lockedUntil: null });
    await throttles.save({ email: "bob@example.com", failedCount: 4, lockedUntil: null });

    await throttles.reset("ana@example.com");
    await throttles.reset("never-failed@example.com");

    expect(await throttles.find("ana@example.com")).toBeNull();
    expect((await throttles.find("bob@example.com"))?.failedCount).toBe(4);
  });
});
