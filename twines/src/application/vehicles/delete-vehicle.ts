import type { PublicUser, VehicleRepository } from "@/application/ports";
import { loadOwnedVehicle } from "@/application/vehicles/owned-vehicle";

export interface DeleteVehicleDeps {
  vehicles: VehicleRepository;
}

/**
 * Deletes the owner's vehicle together with its baselines (VEH-10). The confirmation step
 * belongs to the delivery layer; by the time this runs the owner has already confirmed.
 */
export async function deleteVehicle({ vehicles }: DeleteVehicleDeps, actor: PublicUser, vehicleId: string): Promise<void> {
  const vehicle = await loadOwnedVehicle(vehicles, actor, vehicleId, "Only owners can delete vehicles");
  await vehicles.delete(vehicle.id);
}
