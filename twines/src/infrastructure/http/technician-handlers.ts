import { NextResponse } from "next/server";
import type { GetCurrentUserDeps } from "@/application/auth/get-current-user";
import type { VehicleRepository } from "@/application/ports";
import { findVehicleByPlate } from "@/application/technician/find-vehicle-by-plate";
import { recordService } from "@/application/technician/record-service";
import { createGuard, readJson } from "@/infrastructure/http/guard";
import { toVehicleDto } from "@/infrastructure/http/vehicle-dto";

export type TechnicianHandlerDeps = GetCurrentUserDeps & { vehicles: VehicleRepository };

/**
 * Request handlers for the technician endpoints. Like the other handlers they live outside the
 * route files so tests can call them with plain `Request`s. Owners are refused with 403 by the
 * use cases themselves (AUTH-15).
 */
export function createTechnicianHandlers(deps: TechnicianHandlerDeps) {
  const guarded = createGuard(deps);

  return {
    /** VEH-14, VEH-15: the id and plate of the vehicle registered under `?plate=`. */
    findByPlate: (request: Request) =>
      guarded(request, false, async (user) => {
        const plate = new URL(request.url).searchParams.get("plate") ?? undefined;
        const { id, plate: registeredPlate } = await findVehicleByPlate(deps, user, plate);
        return NextResponse.json({ id, plate: registeredPlate });
      }),

    /** VEH-16, MNT-08: records a serviced part and answers with the recomputed health. */
    recordService: (request: Request, id: string) =>
      guarded(request, true, async (user) => {
        const { vehicle, ...health } = await recordService(deps, user, id, await readJson(request));
        return NextResponse.json({ vehicle: toVehicleDto(vehicle), ...health });
      }),
  };
}
