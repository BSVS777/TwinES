import { beforeEach, describe, expect, it } from "vitest";
import { Forbidden, NotFound } from "@/application/errors";
import type { Vehicle } from "@/application/ports";
import { deleteVehicle, type DeleteVehicleDeps } from "@/application/vehicles/delete-vehicle";
import { listVehicles } from "@/application/vehicles/list-vehicles";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, OWNER_B, REGISTRATION, TECHNICIAN } from "./fakes";

describe("deleteVehicle", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: DeleteVehicleDeps;
  let vehicle: Vehicle;

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles };
    vehicle = await registerVehicle({ vehicles, clock: new FakeClock() }, OWNER_A, REGISTRATION);
  });

  it("VEH-10 removes the vehicle and its baselines, and it no longer appears in the list", async () => {
    await deleteVehicle(deps, OWNER_A, vehicle.id);

    expect(vehicles.vehicles).toEqual([]);
    expect(await vehicles.findById(vehicle.id)).toBeNull();
    expect(await listVehicles(deps, OWNER_A)).toEqual([]);
  });

  it("deletes only the vehicle it was asked to", async () => {
    const other = await registerVehicle({ vehicles, clock: new FakeClock() }, OWNER_A, {
      ...REGISTRATION,
      plate: "KEEP-1",
    });

    await deleteVehicle(deps, OWNER_A, vehicle.id);

    expect(vehicles.vehicles.map((remaining) => remaining.id)).toEqual([other.id]);
  });

  it("VEH-13 answers NotFound for another owner's vehicle and keeps it", async () => {
    await expect(deleteVehicle(deps, OWNER_B, vehicle.id)).rejects.toBeInstanceOf(NotFound);
    expect(vehicles.vehicles).toHaveLength(1);
  });

  it("answers NotFound for an id that does not exist, so a repeated delete is not silent", async () => {
    await deleteVehicle(deps, OWNER_A, vehicle.id);

    await expect(deleteVehicle(deps, OWNER_A, vehicle.id)).rejects.toBeInstanceOf(NotFound);
  });

  it("VEH-17 refuses a technician with Forbidden and keeps the vehicle", async () => {
    await expect(deleteVehicle(deps, TECHNICIAN, vehicle.id)).rejects.toBeInstanceOf(Forbidden);
    await expect(deleteVehicle(deps, TECHNICIAN, "no-such-vehicle")).rejects.toBeInstanceOf(Forbidden);
    expect(vehicles.vehicles).toHaveLength(1);
  });
});
