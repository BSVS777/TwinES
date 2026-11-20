import { Conflict, NotFound, ValidationError } from "@/application/errors";
import type {
  NewVehicle,
  PublicUser,
  ServiceRecord,
  Vehicle,
  VehicleChanges,
  VehicleRepository,
} from "@/application/ports";
import type { PartBaseline } from "@/domain/part-health/health-estimator";
import { MILEAGE_ROLLBACK_MESSAGE } from "@/application/validation/vehicle";

export { FakeClock } from "../auth/fakes";

export const OWNER_A: PublicUser = { id: "owner-a", email: "a@example.com", role: "owner" };
export const OWNER_B: PublicUser = { id: "owner-b", email: "b@example.com", role: "owner" };
export const TECHNICIAN: PublicUser = { id: "tech-1", email: "tech@example.com", role: "technician" };

/** A registration payload as the HTTP layer would pass it on (VEH-01 example). */
export const REGISTRATION = {
  plate: "abc-123",
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  bodyType: "sedan",
  currentMileageKm: 45000,
  purchaseDate: "2020-03-01",
};

/** In-memory vehicle store with the same unique-plate and ownership-miss rules as the database. */
export class InMemoryVehicleRepository implements VehicleRepository {
  readonly vehicles: Vehicle[] = [];
  private counter = 0;

  async create(input: NewVehicle): Promise<Vehicle> {
    this.assertPlateFree(input.plate);
    this.counter += 1;
    const now = new Date("2026-01-01T00:00:00Z");
    const vehicle: Vehicle = {
      ...input,
      baselines: input.baselines ? input.baselines.map((baseline) => ({ ...baseline })) : [],
      id: `vehicle-${this.counter}`,
      createdAt: now,
      updatedAt: now,
    };
    this.vehicles.push(vehicle);
    return { ...vehicle };
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id && vehicle.ownerId === ownerId) ?? null;
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id) ?? null;
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.plate === plate) ?? null;
  }

  async listByOwner(ownerId: string): Promise<Vehicle[]> {
    return this.vehicles.filter((vehicle) => vehicle.ownerId === ownerId);
  }

  async update(id: string, changes: VehicleChanges): Promise<Vehicle> {
    const vehicle = this.vehicles.find((candidate) => candidate.id === id);
    if (!vehicle) throw new NotFound("Vehicle not found");
    if (changes.currentMileageKm !== undefined && changes.currentMileageKm < vehicle.currentMileageKm) {
      throw new ValidationError({ currentMileageKm: MILEAGE_ROLLBACK_MESSAGE });
    }
    if (changes.plate !== undefined && changes.plate !== vehicle.plate) this.assertPlateFree(changes.plate);
    Object.assign(vehicle, changes);
    return { ...vehicle };
  }

  async delete(id: string): Promise<void> {
    const index = this.vehicles.findIndex((vehicle) => vehicle.id === id);
    if (index >= 0) this.vehicles.splice(index, 1);
  }

  async upsertBaseline(vehicleId: string, baseline: PartBaseline): Promise<void> {
    const vehicle = this.vehicles.find((candidate) => candidate.id === vehicleId);
    if (!vehicle) throw new Error(`No vehicle ${vehicleId}`);
    const index = vehicle.baselines.findIndex((existing) => existing.partId === baseline.partId);
    if (index >= 0) vehicle.baselines[index] = { ...baseline };
    else vehicle.baselines.push({ ...baseline });
  }

  async recordService(vehicleId: string, { partId, date, currentMileageKm }: ServiceRecord): Promise<Vehicle> {
    const vehicle = this.vehicles.find((candidate) => candidate.id === vehicleId);
    if (!vehicle) throw new NotFound("Vehicle not found");
    // Like the database write, the odometer only ever moves up and the baseline mileage comes from
    // the row as it is now, not from what the caller read earlier.
    if (currentMileageKm !== undefined && currentMileageKm < vehicle.currentMileageKm) {
      throw new ValidationError({ currentMileageKm: MILEAGE_ROLLBACK_MESSAGE });
    }
    if (currentMileageKm !== undefined) vehicle.currentMileageKm = currentMileageKm;
    await this.upsertBaseline(vehicleId, { partId, mileageKm: vehicle.currentMileageKm, date });
    return { ...vehicle };
  }

  private assertPlateFree(plate: string): void {
    if (this.vehicles.some((vehicle) => vehicle.plate === plate)) {
      throw new Conflict("This plate is already registered", "plate");
    }
  }
}
