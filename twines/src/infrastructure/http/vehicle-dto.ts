import type { Vehicle } from "@/application/ports";

/**
 * The vehicle as the client sees it. The owner and the bookkeeping timestamps stay on the
 * server: the owner is always the signed-in user, so exposing the id would only leak internals.
 */
export function toVehicleDto(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    bodyType: vehicle.bodyType,
    currentMileageKm: vehicle.currentMileageKm,
    purchaseDate: vehicle.purchaseDate,
    monthlyMileageKm: vehicle.monthlyMileageKm,
    baselines: vehicle.baselines,
  };
}
