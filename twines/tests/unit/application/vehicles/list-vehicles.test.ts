import { beforeEach, describe, expect, it } from "vitest";
import { listVehicles } from "@/application/vehicles/list-vehicles";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, OWNER_B, REGISTRATION, TECHNICIAN } from "./fakes";

describe("listVehicles", () => {
  let vehicles: InMemoryVehicleRepository;

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    const deps = { vehicles, clock: new FakeClock() };
    await registerVehicle(deps, OWNER_A, { ...REGISTRATION, plate: "AAA-1" });
    await registerVehicle(deps, OWNER_A, { ...REGISTRATION, plate: "AAA-2" });
    await registerVehicle(deps, OWNER_B, { ...REGISTRATION, plate: "BBB-1" });
  });

  it("VEH-08 lists exactly the actor's own vehicles", async () => {
    const own = await listVehicles({ vehicles }, OWNER_A);

    expect(own.map((vehicle) => vehicle.plate).sort()).toEqual(["AAA-1", "AAA-2"]);
    expect((await listVehicles({ vehicles }, OWNER_B)).map((vehicle) => vehicle.plate)).toEqual(["BBB-1"]);
  });

  it("VEH-11 returns an empty list for an owner with no vehicles", async () => {
    expect(await listVehicles({ vehicles }, { id: "owner-c", email: "c@example.com", role: "owner" })).toEqual([]);
  });

  it("never lists other people's vehicles for a technician", async () => {
    expect(await listVehicles({ vehicles }, TECHNICIAN)).toEqual([]);
  });
});
