import { Forbidden, NotFound } from "@/application/errors";
import type { PublicUser, Vehicle, VehicleRepository } from "@/application/ports";
import { parseInput } from "@/application/validation/parse";
import { plateSearchSchema } from "@/application/validation/vehicle";

export interface FindVehicleByPlateDeps {
  vehicles: VehicleRepository;
}

/**
 * The technician's plate lookup (VEH-14, VEH-15). The typed plate is trimmed and uppercased, the
 * way plates are stored, and must match a registered plate completely. Technicians reach any
 * owner's vehicle; owners are refused outright (AUTH-15).
 */
export async function findVehicleByPlate(
  { vehicles }: FindVehicleByPlateDeps,
  actor: PublicUser,
  plate: unknown,
): Promise<Vehicle> {
  if (actor.role !== "technician") throw new Forbidden("Only technicians can search vehicles by plate");
  const vehicle = await vehicles.findByPlate(parseInput(plateSearchSchema(), plate));
  if (!vehicle) throw new NotFound("No vehicle found for this plate");
  return vehicle;
}
