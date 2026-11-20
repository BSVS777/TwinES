import { Conflict } from "@/application/errors";
import type {
  BodyType,
  NewVehicle,
  ServiceRecord,
  Vehicle,
  VehicleChanges,
  VehicleRepository,
} from "@/application/ports";
import type { PartId } from "@/domain/part-health/catalog";
import type { PartBaseline } from "@/domain/part-health/health-estimator";
import type { CalendarDate } from "@/domain/shared/calendar-date";
import type { PrismaClient } from "@/generated/prisma/client";
import { uniqueViolationFields } from "./prisma-errors";

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
    try {
      const row = await this.db.vehicle.update({ where: { id }, data: changes, include: withBaselines });
      return toVehicle(row);
    } catch (error) {
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

  async recordService(vehicleId: string, { baseline, currentMileageKm }: ServiceRecord): Promise<Vehicle> {
    const { partId, mileageKm, date } = baseline;
    // One transaction: a failed baseline write must not leave the new mileage behind. An omitted
    // mileage leaves the column as it is.
    await this.db.$transaction([
      this.db.vehicle.update({ where: { id: vehicleId }, data: { currentMileageKm } }),
      this.db.partBaseline.upsert({
        where: { vehicleId_partId: { vehicleId, partId } },
        create: { vehicleId, partId, mileageKm, date },
        update: { mileageKm, date },
      }),
    ]);
    return toVehicle(await this.db.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, include: withBaselines }));
  }
}
