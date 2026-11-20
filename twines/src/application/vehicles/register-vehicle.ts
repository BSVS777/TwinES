import { Conflict, Forbidden } from "@/application/errors";
import type { Clock, PublicUser, Vehicle, VehicleRepository } from "@/application/ports";
import { parseInput } from "@/application/validation/parse";
import { vehicleSchema } from "@/application/validation/vehicle";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import type { PartBaseline } from "@/domain/part-health/health-estimator";
import type { CalendarDate } from "@/domain/shared/calendar-date";

export interface RegisterVehicleDeps {
  vehicles: VehicleRepository;
  clock: Clock;
}

const DUPLICATE_PLATE = "This plate is already registered";

/** Conservative assumption: a part never serviced since the vehicle was bought (VEH-05). */
function defaultBaselines(purchaseDate: CalendarDate): PartBaseline[] {
  return MAINTENANCE_CATALOG.map((part) => ({ partId: part.id, mileageKm: 0, date: purchaseDate }));
}

/**
 * Registers a vehicle for the signed-in owner (VEH-01). The owner comes from the actor, never
 * from the input, and every part gets a default baseline (VEH-05). Plates are unique across all
 * owners (VEH-02). Only owners register vehicles; a technician is refused before the input is read.
 */
export async function registerVehicle(
  { vehicles, clock }: RegisterVehicleDeps,
  actor: PublicUser,
  input: unknown,
): Promise<Vehicle> {
  if (actor.role !== "owner") throw new Forbidden("Only owners can register vehicles");

  const data = parseInput(vehicleSchema(clock.today()), input);
  if (await vehicles.findByPlate(data.plate)) throw new Conflict(DUPLICATE_PLATE, "plate");

  try {
    return await vehicles.create({ ...data, ownerId: actor.id, baselines: defaultBaselines(data.purchaseDate) });
  } catch (error) {
    // A concurrent registration can win the race between the lookup and the insert.
    if (error instanceof Conflict) throw new Conflict(DUPLICATE_PLATE, "plate");
    throw error;
  }
}
