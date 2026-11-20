import { NotFound } from "@/application/errors";
import type { Clock, PublicUser, Vehicle, VehicleRepository } from "@/application/ports";
import { computeNextMaintenance, computePartDues, type NextMaintenance, type PartDue } from "@/domain/maintenance/schedule";
import type { HealthEstimator, HealthStatus, PartHealth } from "@/domain/part-health/health-estimator";
import { createHealthEstimator } from "@/domain/part-health/rule-based-estimator";
import { worstStatus } from "@/domain/part-health/status";

export interface GetVehicleHealthDeps {
  vehicles: VehicleRepository;
  clock: Clock;
  /** Defaults to the rule-based estimator; a different one can be injected (HLT-10). */
  estimator?: HealthEstimator;
}

export interface VehicleHealth {
  vehicle: Vehicle;
  /** One entry per catalog part, in catalog order. */
  health: PartHealth[];
  /** Due mileage, effective due date and overdue flag per part, in catalog order. */
  dues: PartDue[];
  nextMaintenance: NextMaintenance;
  /** The worst part status (HLT-09). */
  overallStatus: HealthStatus;
}

/**
 * Everything the health view needs for one vehicle, computed for the clock's today. Owners reach
 * only their own vehicles, and a miss looks the same whether the vehicle is missing or someone
 * else's (VEH-12); technicians may read any vehicle (VEH-14).
 */
export async function getVehicleHealth(
  { vehicles, clock, estimator = createHealthEstimator() }: GetVehicleHealthDeps,
  actor: PublicUser,
  vehicleId: string,
): Promise<VehicleHealth> {
  const vehicle =
    actor.role === "technician"
      ? await vehicles.findById(vehicleId)
      : await vehicles.findByIdForOwner(vehicleId, actor.id);
  if (!vehicle) throw new NotFound("Vehicle not found");

  const today = clock.today();
  const health = estimator.estimate(vehicle, today);
  const dues = computePartDues(vehicle, today);
  return {
    vehicle,
    health,
    dues,
    nextMaintenance: computeNextMaintenance(dues, vehicle, today),
    overallStatus: worstStatus(health.map((part) => part.status)),
  };
}
