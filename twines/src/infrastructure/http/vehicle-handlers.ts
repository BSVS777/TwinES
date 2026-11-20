import { NextResponse } from "next/server";
import type { GetCurrentUserDeps } from "@/application/auth/get-current-user";
import type { VehicleRepository } from "@/application/ports";
import { deleteVehicle } from "@/application/vehicles/delete-vehicle";
import { getVehicleHealth } from "@/application/vehicles/get-vehicle-health";
import { listVehicles } from "@/application/vehicles/list-vehicles";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { setBaseline } from "@/application/vehicles/set-baseline";
import { updateVehicle } from "@/application/vehicles/update-vehicle";
import { createGuard, readJson } from "@/infrastructure/http/guard";
import { toVehicleDto } from "@/infrastructure/http/vehicle-dto";

export type VehicleHandlerDeps = GetCurrentUserDeps & { vehicles: VehicleRepository };

/**
 * Request handlers for the vehicle endpoints. Like the auth handlers they live outside the route
 * files (a route module may only export HTTP methods) so tests can call them with plain
 * `Request`s. Every handler resolves the session first (AUTH-14); the mutating ones check the
 * `Origin` header before anything else.
 */
export function createVehicleHandlers(deps: VehicleHandlerDeps) {
  const guarded = createGuard(deps);

  return {
    /** VEH-08: the signed-in owner's vehicles. */
    list: (request: Request) =>
      guarded(request, false, async (user) => {
        const vehicles = await listVehicles(deps, user);
        return NextResponse.json({ vehicles: vehicles.map(toVehicleDto) });
      }),

    /** VEH-01 to VEH-04: registers a vehicle for the signed-in owner. */
    register: (request: Request) =>
      guarded(request, true, async (user) => {
        const vehicle = await registerVehicle(deps, user, await readJson(request));
        return NextResponse.json({ vehicle: toVehicleDto(vehicle) }, { status: 201 });
      }),

    /** VEH-12: one vehicle with its computed health; someone else's vehicle is a 404. */
    get: (request: Request, id: string) =>
      guarded(request, false, async (user) => {
        const { vehicle, ...health } = await getVehicleHealth(deps, user, id);
        return NextResponse.json({ vehicle: toVehicleDto(vehicle), ...health });
      }),

    /** VEH-09, VEH-13, VEH-17: edits the details of an owned vehicle. */
    update: (request: Request, id: string) =>
      guarded(request, true, async (user) => {
        const vehicle = await updateVehicle(deps, user, id, await readJson(request));
        return NextResponse.json({ vehicle: toVehicleDto(vehicle) });
      }),

    /** VEH-10, VEH-13, VEH-17: deletes an owned vehicle and its baselines. */
    remove: (request: Request, id: string) =>
      guarded(request, true, async (user) => {
        await deleteVehicle(deps, user, id);
        return new NextResponse(null, { status: 204 });
      }),

    /** VEH-06, VEH-07: sets one part's service baseline on an owned vehicle. */
    setBaseline: (request: Request, id: string) =>
      guarded(request, true, async (user) => {
        const baseline = await setBaseline(deps, user, id, await readJson(request));
        return NextResponse.json({ baseline });
      }),
  };
}
