import { Conflict, ValidationError } from "@/application/errors";
import type { Clock, PublicUser, Vehicle, VehicleRepository } from "@/application/ports";
import { parseInput } from "@/application/validation/parse";
import { vehicleUpdateSchema } from "@/application/validation/vehicle";
import { loadOwnedVehicle } from "@/application/vehicles/owned-vehicle";

export interface UpdateVehicleDeps {
  vehicles: VehicleRepository;
  clock: Clock;
}

const DUPLICATE_PLATE = "This plate is already registered";
const MILEAGE_ROLLBACK = "Mileage cannot be lower than the current value";

/**
 * Edits the details of the owner's vehicle under the registration rules. The odometer never goes
 * back (VEH-09) and a plate change must stay unique across all owners (VEH-02). Ownership and
 * baselines cannot change here, whatever the input carries.
 */
export async function updateVehicle(
  { vehicles, clock }: UpdateVehicleDeps,
  actor: PublicUser,
  vehicleId: string,
  input: unknown,
): Promise<Vehicle> {
  const vehicle = await loadOwnedVehicle(vehicles, actor, vehicleId, "Only owners can edit vehicles");
  const changes = parseInput(vehicleUpdateSchema(clock.today()), input);

  if (changes.currentMileageKm !== undefined && changes.currentMileageKm < vehicle.currentMileageKm) {
    throw new ValidationError({ currentMileageKm: MILEAGE_ROLLBACK });
  }
  if (changes.plate !== undefined && changes.plate !== vehicle.plate && (await vehicles.findByPlate(changes.plate))) {
    throw new Conflict(DUPLICATE_PLATE, "plate");
  }

  try {
    return await vehicles.update(vehicle.id, changes);
  } catch (error) {
    // A concurrent change can take the plate between the lookup and the update.
    if (error instanceof Conflict) throw new Conflict(DUPLICATE_PLATE, "plate");
    throw error;
  }
}
