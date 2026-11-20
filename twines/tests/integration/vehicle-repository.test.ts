import { beforeEach, describe, expect, it } from "vitest";
import { Conflict, NotFound, ValidationError } from "@/application/errors";
import type { NewVehicle } from "@/application/ports";
import { MILEAGE_ROLLBACK_MESSAGE } from "@/application/validation/vehicle";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import type { PartBaseline } from "@/domain/part-health/health-estimator";
import type { CalendarDate } from "@/domain/shared/calendar-date";
import { getDb } from "@/infrastructure/db";
import { PrismaUserRepository } from "@/infrastructure/repositories/user-repository";
import { PrismaVehicleRepository } from "@/infrastructure/repositories/vehicle-repository";
import { resetDatabase } from "./helpers";

const vehicles = new PrismaVehicleRepository(getDb());
const users = new PrismaUserRepository(getDb());

const purchaseDate = "2020-03-01" as CalendarDate;
const allBaselines: PartBaseline[] = MAINTENANCE_CATALOG.map((part) => ({
  partId: part.id,
  mileageKm: 40000,
  date: "2026-01-15" as CalendarDate,
}));

let ownerId: string;
let otherOwnerId: string;

function newVehicle(overrides: Partial<NewVehicle> = {}): NewVehicle {
  return {
    ownerId,
    plate: "ABC-123",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    bodyType: "sedan",
    currentMileageKm: 45000,
    purchaseDate,
    monthlyMileageKm: 1000,
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDatabase();
  ownerId = (await users.create({ email: "ana@example.com", passwordHash: "h", role: "owner" })).id;
  otherOwnerId = (await users.create({ email: "bob@example.com", passwordHash: "h", role: "owner" })).id;
});

describe("PrismaVehicleRepository", () => {
  describe("create", () => {
    it("persists the vehicle with its eight baselines when given", async () => {
      const created = await vehicles.create(newVehicle({ baselines: allBaselines }));

      expect(created).toMatchObject({ ownerId, plate: "ABC-123", year: 2020, bodyType: "sedan", purchaseDate });
      expect(created.baselines).toHaveLength(8);
      expect(created.baselines).toEqual(expect.arrayContaining(allBaselines));
      expect(await getDb().partBaseline.count({ where: { vehicleId: created.id } })).toBe(8);
    });

    it("persists a vehicle without baselines when none are given", async () => {
      const created = await vehicles.create(newVehicle());

      expect(created.baselines).toEqual([]);
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it("rejects a duplicate plate from any owner with Conflict naming the plate field", async () => {
      await vehicles.create(newVehicle());

      const duplicate = vehicles.create(newVehicle({ ownerId: otherOwnerId }));

      await expect(duplicate).rejects.toBeInstanceOf(Conflict);
      await expect(duplicate).rejects.toMatchObject({ field: "plate" });
    });

    it("does not leave a half-saved vehicle behind when the plate is taken", async () => {
      await vehicles.create(newVehicle());
      await vehicles.create(newVehicle({ plate: "XYZ-999" }));

      await expect(vehicles.create(newVehicle({ baselines: allBaselines }))).rejects.toBeInstanceOf(Conflict);

      expect(await getDb().partBaseline.count()).toBe(0);
    });
  });

  describe("lookups", () => {
    it("returns the vehicle for its owner and null for another owner or an unknown id", async () => {
      const created = await vehicles.create(newVehicle());

      expect(await vehicles.findByIdForOwner(created.id, ownerId)).toEqual(created);
      expect(await vehicles.findByIdForOwner(created.id, otherOwnerId)).toBeNull();
      expect(await vehicles.findByIdForOwner("missing-id", ownerId)).toBeNull();
    });

    it("finds a vehicle by id and by exact plate regardless of owner", async () => {
      const created = await vehicles.create(newVehicle({ baselines: allBaselines.slice(0, 2) }));

      expect(await vehicles.findById(created.id)).toEqual(created);
      expect(await vehicles.findByPlate("ABC-123")).toEqual(created);
      expect(await vehicles.findByPlate("abc-123")).toBeNull();
      expect(await vehicles.findById("missing-id")).toBeNull();
    });

    it("lists only the vehicles of the given owner, oldest first", async () => {
      const first = await vehicles.create(newVehicle({ plate: "AAA-111" }));
      const second = await vehicles.create(newVehicle({ plate: "BBB-222" }));
      await vehicles.create(newVehicle({ plate: "CCC-333", ownerId: otherOwnerId }));

      expect((await vehicles.listByOwner(ownerId)).map((v) => v.id)).toEqual([first.id, second.id]);
      expect(await vehicles.listByOwner("nobody")).toEqual([]);
    });
  });

  describe("update", () => {
    it("changes only the given fields and keeps the baselines", async () => {
      const created = await vehicles.create(newVehicle({ baselines: allBaselines }));

      const updated = await vehicles.update(created.id, { currentMileageKm: 46000, make: "Honda" });

      expect(updated).toMatchObject({ currentMileageKm: 46000, make: "Honda", model: "Corolla", plate: "ABC-123" });
      expect(updated.baselines).toHaveLength(8);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it("rejects moving a vehicle to a plate that is already registered", async () => {
      await vehicles.create(newVehicle());
      const other = await vehicles.create(newVehicle({ plate: "XYZ-999" }));

      const clash = vehicles.update(other.id, { plate: "ABC-123" });

      await expect(clash).rejects.toBeInstanceOf(Conflict);
      await expect(clash).rejects.toMatchObject({ field: "plate" });
    });
  });

  describe("update and the odometer", () => {
    const rollback = { errors: { currentMileageKm: MILEAGE_ROLLBACK_MESSAGE } };

    it("raises the mileage and keeps it when the same value is written again", async () => {
      const created = await vehicles.create(newVehicle());

      expect((await vehicles.update(created.id, { currentMileageKm: 46000 })).currentMileageKm).toBe(46000);
      expect((await vehicles.update(created.id, { currentMileageKm: 46000 })).currentMileageKm).toBe(46000);
    });

    it("VEH-09 refuses a value below the stored one even when the caller read the old value earlier", async () => {
      const created = await vehicles.create(newVehicle());
      // Another request raises the odometer after this caller read 45000 ...
      await vehicles.update(created.id, { currentMileageKm: 46000 });

      // ... and then this caller writes a value based on its stale read.
      const stale = vehicles.update(created.id, { currentMileageKm: 45200, make: "Honda" });

      await expect(stale).rejects.toBeInstanceOf(ValidationError);
      await expect(stale).rejects.toMatchObject(rollback);
      const stored = await vehicles.findById(created.id);
      expect(stored).toMatchObject({ currentMileageKm: 46000, make: "Toyota" });
    });

    it("answers NotFound for a vehicle that no longer exists, with or without a mileage", async () => {
      await expect(vehicles.update("missing-id", { currentMileageKm: 46000 })).rejects.toBeInstanceOf(NotFound);
      await expect(vehicles.update("missing-id", { make: "Honda" })).rejects.toBeInstanceOf(NotFound);
    });

    it("never ends below the highest reading when writes race", async () => {
      const created = await vehicles.create(newVehicle());
      const readings = [45100, 45900, 45300, 45700, 45500, 45200, 45800];

      const results = await Promise.allSettled(readings.map((km) => vehicles.update(created.id, { currentMileageKm: km })));

      expect((await vehicles.findById(created.id))?.currentMileageKm).toBe(45900);
      for (const result of results) {
        if (result.status === "rejected") expect(result.reason).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("delete", () => {
    it("removes the vehicle and cascades to its baselines only", async () => {
      const doomed = await vehicles.create(newVehicle({ baselines: allBaselines }));
      const kept = await vehicles.create(newVehicle({ plate: "XYZ-999", baselines: allBaselines.slice(0, 3) }));

      await vehicles.delete(doomed.id);

      expect(await vehicles.findById(doomed.id)).toBeNull();
      expect(await getDb().partBaseline.count({ where: { vehicleId: doomed.id } })).toBe(0);
      expect((await vehicles.findById(kept.id))?.baselines).toHaveLength(3);
    });

    it("ignores an unknown id", async () => {
      await expect(vehicles.delete("missing-id")).resolves.toBeUndefined();
    });
  });

  describe("upsertBaseline", () => {
    it("adds a baseline for a part that has none", async () => {
      const created = await vehicles.create(newVehicle());
      const baseline = { partId: "tires", mileageKm: 30000, date: "2025-06-01" as CalendarDate } as const;

      await vehicles.upsertBaseline(created.id, baseline);

      expect((await vehicles.findById(created.id))?.baselines).toEqual([baseline]);
    });

    it("replaces the baseline of a part that already has one without touching the others", async () => {
      const created = await vehicles.create(newVehicle({ baselines: allBaselines }));
      const serviced = { partId: "battery", mileageKm: 45000, date: "2026-11-19" as CalendarDate } as const;

      await vehicles.upsertBaseline(created.id, serviced);

      const baselines = (await vehicles.findById(created.id))!.baselines;
      expect(baselines).toHaveLength(8);
      expect(baselines.find((b) => b.partId === "battery")).toEqual(serviced);
      expect(baselines.find((b) => b.partId === "tires")).toEqual(allBaselines.find((b) => b.partId === "tires"));
    });
  });

  describe("recordService", () => {
    const serviced = { partId: "engine-oil", mileageKm: 45200, date: "2026-11-19" as CalendarDate } as const;
    const visit = { partId: "engine-oil", date: "2026-11-19" as CalendarDate } as const;

    it("saves the new mileage and replaces the part's baseline together", async () => {
      const created = await vehicles.create(newVehicle({ baselines: allBaselines }));

      const saved = await vehicles.recordService(created.id, { ...visit, currentMileageKm: 45200 });

      expect(saved.currentMileageKm).toBe(45200);
      expect(saved.baselines).toHaveLength(8);
      expect(saved.baselines.find((b) => b.partId === "engine-oil")).toEqual(serviced);
      expect(saved.baselines.find((b) => b.partId === "tires")).toEqual(allBaselines.find((b) => b.partId === "tires"));
      expect(await vehicles.findById(created.id)).toEqual(saved);
    });

    it("keeps the mileage as it is when none is given and adds a baseline the part did not have", async () => {
      const created = await vehicles.create(newVehicle());

      const saved = await vehicles.recordService(created.id, visit);

      expect(saved.currentMileageKm).toBe(45000);
      expect(saved.baselines).toEqual([{ ...serviced, mileageKm: 45000 }]);
    });

    it("leaves other vehicles alone", async () => {
      const created = await vehicles.create(newVehicle());
      const other = await vehicles.create(newVehicle({ plate: "XYZ-999" }));

      await vehicles.recordService(created.id, { ...visit, currentMileageKm: 45200 });

      expect(await vehicles.findById(other.id)).toEqual(other);
    });

    it("answers NotFound for an unknown vehicle, with or without a reading, and writes nothing", async () => {
      await expect(vehicles.recordService("missing-id", { ...visit, currentMileageKm: 45200 })).rejects.toBeInstanceOf(NotFound);
      await expect(vehicles.recordService("missing-id", visit)).rejects.toBeInstanceOf(NotFound);

      expect(await getDb().partBaseline.count()).toBe(0);
    });

    it("VEH-09 refuses a stale reading, keeps the higher mileage and writes no baseline", async () => {
      const created = await vehicles.create(newVehicle());
      // Another request raises the odometer after this caller read 45000 ...
      await vehicles.update(created.id, { currentMileageKm: 46000 });

      // ... and then this caller records a service with a reading based on its stale read.
      const stale = vehicles.recordService(created.id, { ...visit, currentMileageKm: 45200 });

      await expect(stale).rejects.toBeInstanceOf(ValidationError);
      await expect(stale).rejects.toMatchObject({ errors: { currentMileageKm: MILEAGE_ROLLBACK_MESSAGE } });
      expect((await vehicles.findById(created.id))?.currentMileageKm).toBe(46000);
      expect(await getDb().partBaseline.count()).toBe(0);
    });

    it("takes the baseline mileage from the stored row when no reading is given", async () => {
      const created = await vehicles.create(newVehicle());
      await vehicles.update(created.id, { currentMileageKm: 46000 });

      const saved = await vehicles.recordService(created.id, visit);

      expect(saved.currentMileageKm).toBe(46000);
      expect(saved.baselines).toEqual([{ ...serviced, mileageKm: 46000 }]);
    });

    it("never ends below the highest reading when services and edits race", async () => {
      const created = await vehicles.create(newVehicle());

      const results = await Promise.allSettled([
        vehicles.recordService(created.id, { ...visit, currentMileageKm: 45200 }),
        vehicles.update(created.id, { currentMileageKm: 45900 }),
        vehicles.recordService(created.id, { ...visit, partId: "tires", currentMileageKm: 45500 }),
        vehicles.update(created.id, { currentMileageKm: 45100 }),
        vehicles.recordService(created.id, { ...visit, partId: "battery", currentMileageKm: 45700 }),
      ]);

      expect((await vehicles.findById(created.id))?.currentMileageKm).toBe(45900);
      for (const result of results) {
        if (result.status === "rejected") expect(result.reason).toBeInstanceOf(ValidationError);
      }
    });

    it("saves neither the mileage nor the baseline when the baseline write fails", async () => {
      const created = await vehicles.create(newVehicle());
      // A trigger makes exactly this baseline write fail, after the mileage update has run.
      await getDb().$executeRawUnsafe(
        "CREATE TRIGGER fail_service_baseline BEFORE INSERT ON PartBaseline WHEN NEW.mileageKm = 45201 " +
          "BEGIN SELECT RAISE(ABORT, 'baseline write refused'); END",
      );

      try {
        await expect(
          vehicles.recordService(created.id, { ...visit, currentMileageKm: 45201 }),
        ).rejects.toThrow();
      } finally {
        await getDb().$executeRawUnsafe("DROP TRIGGER fail_service_baseline");
      }

      expect((await vehicles.findById(created.id))?.currentMileageKm).toBe(45000);
      expect(await getDb().partBaseline.count()).toBe(0);
    });
  });
});
