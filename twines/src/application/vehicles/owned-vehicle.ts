import { Forbidden, NotFound } from "@/application/errors";
import type { PublicUser, Vehicle, VehicleRepository } from "@/application/ports";

/**
 * Loads a vehicle the actor may change. Technicians are refused outright (VEH-17); an owner who
 * does not own the vehicle gets the same `NotFound` as for an id that does not exist, so a
 * vehicle's existence is never disclosed (VEH-13).
 */
export async function loadOwnedVehicle(
  vehicles: VehicleRepository,
  actor: PublicUser,
  vehicleId: string,
  forbiddenMessage: string,
): Promise<Vehicle> {
  if (actor.role !== "owner") throw new Forbidden(forbiddenMessage);
  const vehicle = await vehicles.findByIdForOwner(vehicleId, actor.id);
  if (!vehicle) throw new NotFound("Vehicle not found");
  return vehicle;
}
