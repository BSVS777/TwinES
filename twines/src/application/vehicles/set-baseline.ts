import { ValidationError } from "@/application/errors";
import type { Clock, PublicUser, VehicleRepository } from "@/application/ports";
import { parseInput } from "@/application/validation/parse";
import { baselineSchema } from "@/application/validation/vehicle";
import { loadOwnedVehicle } from "@/application/vehicles/owned-vehicle";
import type { PartBaseline } from "@/domain/part-health/health-estimator";

export interface SetBaselineDeps {
  vehicles: VehicleRepository;
  clock: Clock;
}

/**
 * Sets when and at what mileage the owner last serviced one part (VEH-06). The mileage cannot be
 * above the vehicle's current mileage and the date cannot be in the future (VEH-07).
 */
export async function setBaseline(
  { vehicles, clock }: SetBaselineDeps,
  actor: PublicUser,
  vehicleId: string,
  input: unknown,
): Promise<PartBaseline> {
  const vehicle = await loadOwnedVehicle(vehicles, actor, vehicleId, "Only owners can set baselines");
  const baseline = parseInput(baselineSchema(clock.today()), input);

  if (baseline.mileageKm > vehicle.currentMileageKm) {
    throw new ValidationError({ mileageKm: "Mileage cannot be higher than the vehicle's current mileage" });
  }

  await vehicles.upsertBaseline(vehicle.id, baseline);
  return baseline;
}
