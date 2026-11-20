import type { PublicUser, Vehicle, VehicleRepository } from "@/application/ports";

export interface ListVehiclesDeps {
  vehicles: VehicleRepository;
}

/** The vehicles the actor owns, and only those (VEH-08). */
export async function listVehicles({ vehicles }: ListVehiclesDeps, actor: PublicUser): Promise<Vehicle[]> {
  return vehicles.listByOwner(actor.id);
}
