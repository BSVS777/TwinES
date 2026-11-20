import { Forbidden, NotFound, ValidationError } from "@/application/errors";
import type { PublicUser } from "@/application/ports";
import { parseInput } from "@/application/validation/parse";
import { MILEAGE_ROLLBACK_MESSAGE, serviceSchema } from "@/application/validation/vehicle";
import { getVehicleHealth, type GetVehicleHealthDeps, type VehicleHealth } from "@/application/vehicles/get-vehicle-health";

export type RecordServiceDeps = GetVehicleHealthDeps;

/**
 * Records that a technician serviced one part (VEH-16): the part's baseline becomes the
 * resulting mileage and today's date, and the odometer is updated when a new reading is given.
 * The reading can equal the current mileage but never go below it (VEH-09), and the two writes
 * land together. Returns the recomputed health, so the serviced part reads green and the next
 * maintenance reflects the new baseline (MNT-08). Owners are refused outright (AUTH-15).
 */
export async function recordService(
  deps: RecordServiceDeps,
  actor: PublicUser,
  vehicleId: string,
  input: unknown,
): Promise<VehicleHealth> {
  if (actor.role !== "technician") throw new Forbidden("Only technicians can record a service");
  const { vehicles, clock } = deps;
  const vehicle = await vehicles.findById(vehicleId);
  if (!vehicle) throw new NotFound("Vehicle not found");

  const { partId, currentMileageKm } = parseInput(serviceSchema(), input);
  if (currentMileageKm !== undefined && currentMileageKm < vehicle.currentMileageKm) {
    throw new ValidationError({ currentMileageKm: MILEAGE_ROLLBACK_MESSAGE });
  }

  // The early check above only gives a quick answer; the write repeats it atomically, and takes the
  // baseline mileage from the vehicle as it is then, so a concurrent change is never overwritten.
  await vehicles.recordService(vehicle.id, { partId, date: clock.today(), currentMileageKm });
  return getVehicleHealth(deps, actor, vehicle.id);
}
