import { NextResponse } from "next/server";
import { getCurrentUser, type GetCurrentUserDeps } from "@/application/auth/get-current-user";
import { Unauthorized } from "@/application/errors";
import type { PublicUser, Vehicle, VehicleRepository } from "@/application/ports";
import { deleteVehicle } from "@/application/vehicles/delete-vehicle";
import { getVehicleHealth } from "@/application/vehicles/get-vehicle-health";
import { listVehicles } from "@/application/vehicles/list-vehicles";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { setBaseline } from "@/application/vehicles/set-baseline";
import { updateVehicle } from "@/application/vehicles/update-vehicle";
import { readSessionToken } from "@/infrastructure/auth/session-cookie";
import { handle } from "@/infrastructure/http/handle";
import { assertSameOrigin } from "@/infrastructure/http/origin-check";

export type VehicleHandlerDeps = GetCurrentUserDeps & { vehicles: VehicleRepository };

/** An unreadable body is passed on as `undefined`, which input validation reports as a 400. */
async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined);
}

/**
 * The vehicle as the client sees it. The owner and the bookkeeping timestamps stay on the
 * server: the owner is always the signed-in user, so exposing the id would only leak internals.
 */
function toVehicleDto(vehicle: Vehicle) {
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

/**
 * Request handlers for the vehicle endpoints. Like the auth handlers they live outside the route
 * files (a route module may only export HTTP methods) so tests can call them with plain
 * `Request`s. Every handler resolves the session first (AUTH-14); the mutating ones check the
 * `Origin` header before anything else.
 */
export function createVehicleHandlers(deps: VehicleHandlerDeps) {
  /** The signed-in user behind the request's cookie, or a 401 (AUTH-14). */
  async function authenticate(request: Request): Promise<PublicUser> {
    const user = await getCurrentUser(deps, readSessionToken(request));
    if (!user) throw new Unauthorized();
    return user;
  }

  /** Runs `action` for the authenticated user; `mutating` requests pass the CSRF check first. */
  function guarded(
    request: Request,
    mutating: boolean,
    action: (user: PublicUser) => Promise<Response>,
  ): Promise<Response> {
    return handle(async () => {
      if (mutating) assertSameOrigin(request);
      return action(await authenticate(request));
    });
  }

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
