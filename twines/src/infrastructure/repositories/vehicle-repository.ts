import { Conflict, NotFound, ValidationError } from "@/application/errors";
import type {
  BodyType,
  NewVehicle,
  ServiceRecord,
  Vehicle,
  VehicleChanges,
  VehicleRepository,
} from "@/application/ports";
import { MILEAGE_ROLLBACK_MESSAGE } from "@/application/validation/vehicle";
import type { PartId } from "@/domain/part-health/catalog";
import type { PartBaseline } from "@/domain/part-health/health-estimator";
import type { CalendarDate } from "@/domain/shared/calendar-date";
import type { PrismaClient } from "@/generated/prisma/client";
import { isRecordNotFound, uniqueViolationFields } from "./prisma-errors";

interface BaselineRow {
  partId: string;
  mileageKm: number;
  date: string;
}

interface VehicleRow {
  id: string;
  ownerId: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
  currentMileageKm: number;
  purchaseDate: string;
  monthlyMileageKm: number;
  createdAt: Date;
  updatedAt: Date;
  baselines: BaselineRow[];
}

// Baselines are always loaded with their vehicle, in a stable order.
const withBaselines = { baselines: { orderBy: { partId: "asc" } } } as const;

/** Maps a row to the port type; text columns only ever hold values written from the typed unions. */
function toVehicle(row: VehicleRow): Vehicle {
  return {
    ...row,
    bodyType: row.bodyType as BodyType,
    purchaseDate: row.purchaseDate as CalendarDate,
    baselines: row.baselines.map(toBaseline),
  };
}

function toBaseline(row: BaselineRow): PartBaseline {
  return { partId: row.partId as PartId, mileageKm: row.mileageKm, date: row.date as CalendarDate };
}

function rethrowDuplicatePlate(error: unknown): never {
  if (uniqueViolationFields(error)?.includes("plate")) {
    throw new Conflict("This plate is already registered", "plate");
  }
  throw error;
}

function mileageRollback(): ValidationError {
  return new ValidationError({ currentMileageKm: MILEAGE_ROLLBACK_MESSAGE });
}

export class PrismaVehicleRepository implements VehicleRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: NewVehicle): Promise<Vehicle> {
    const { baselines = [], ...details } = input;
    try {
      const row = await this.db.vehicle.create({
        data: { ...details, baselines: { create: baselines } },
        include: withBaselines,
      });
      return toVehicle(row);
    } catch (error) {
      return rethrowDuplicatePlate(error);
    }
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Vehicle | null> {
    const row = await this.db.vehicle.findFirst({ where: { id, ownerId }, include: withBaselines });
    return row && toVehicle(row);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const row = await this.db.vehicle.findUnique({ where: { id }, include: withBaselines });
    return row && toVehicle(row);
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    const row = await this.db.vehicle.findUnique({ where: { plate }, include: withBaselines });
    return row && toVehicle(row);
  }

  async listByOwner(ownerId: string): Promise<Vehicle[]> {
    const rows = await this.db.vehicle.findMany({
      where: { ownerId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: withBaselines,
    });
    return rows.map(toVehicle);
  }

  async update(id: string, changes: VehicleChanges): Promise<Vehicle> {
    const { currentMileageKm } = changes;
    // The odometer check is part of the UPDATE itself, so a value read earlier can never be
    // written over a higher one that landed in between.
    const where = currentMileageKm === undefined ? { id } : { id, currentMileageKm: { lte: currentMileageKm } };
    try {
      const row = await this.db.vehicle.update({ where, data: changes, include: withBaselines });
      return toVehicle(row);
    } catch (error) {
      if (isRecordNotFound(error)) {
        // Either the vehicle is gone or its mileage is already above the new value.
        const exists = currentMileageKm !== undefined && (await this.db.vehicle.count({ where: { id } })) > 0;
        throw exists ? mileageRollback() : new NotFound("Vehicle not found");
      }
      return rethrowDuplicatePlate(error);
    }
  }

  async delete(id: string): Promise<void> {
    // Baselines are removed by the database through ON DELETE CASCADE.
    await this.db.vehicle.deleteMany({ where: { id } });
  }

  async upsertBaseline(vehicleId: string, baseline: PartBaseline): Promise<void> {
    const { partId, mileageKm, date } = baseline;
    await this.db.partBaseline.upsert({
      where: { vehicleId_partId: { vehicleId, partId } },
      create: { vehicleId, partId, mileageKm, date },
      update: { mileageKm, date },
    });
  }

  async recordService(vehicleId: string, { partId, date, currentMileageKm }: ServiceRecord): Promise<Vehicle> {
    // One transaction: a failed baseline write must not leave the new mileage behind. The vehicle
    // is read inside it, so an omitted reading uses the mileage as it is now, and the mileage write
    // only matches while the stored value is not above the new one.
    await this.db.$transaction(async (tx) => {
      const current = await tx.vehicle.findUnique({ where: { id: vehicleId }, select: { currentMileageKm: true } });
      if (!current) throw new NotFound("Vehicle not found");

      if (currentMileageKm !== undefined) {
        const { count } = await tx.vehicle.updateMany({
          where: { id: vehicleId, currentMileageKm: { lte: currentMileageKm } },
          data: { currentMileageKm },
        });
        if (count === 0) throw mileageRollback();
      }

      const mileageKm = currentMileageKm ?? current.currentMileageKm;
      await tx.partBaseline.upsert({
        where: { vehicleId_partId: { vehicleId, partId } },
        create: { vehicleId, partId, mileageKm, date },
        update: { mileageKm, date },
      });
    });
    return toVehicle(await this.db.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, include: withBaselines }));
  }
}
