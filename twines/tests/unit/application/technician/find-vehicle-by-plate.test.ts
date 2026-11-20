import { beforeEach, describe, expect, it, vi } from "vitest";
import { Forbidden, NotFound, ValidationError } from "@/application/errors";
import type { Vehicle } from "@/application/ports";
import { findVehicleByPlate, type FindVehicleByPlateDeps } from "@/application/technician/find-vehicle-by-plate";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, REGISTRATION, TECHNICIAN } from "../vehicles/fakes";

describe("findVehicleByPlate", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: FindVehicleByPlateDeps;
  let vehicle: Vehicle;

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles };
    vehicle = await registerVehicle({ vehicles, clock: new FakeClock() }, OWNER_A, REGISTRATION);
  });

  it("VEH-14 finds the vehicle whatever the case of the typed plate", async () => {
    // The registered plate is stored as "ABC-123".
    await expect(findVehicleByPlate(deps, TECHNICIAN, "abc-123")).resolves.toMatchObject({ id: vehicle.id });
    await expect(findVehicleByPlate(deps, TECHNICIAN, "ABC-123")).resolves.toMatchObject({ id: vehicle.id });
    await expect(findVehicleByPlate(deps, TECHNICIAN, "aBc-123")).resolves.toMatchObject({ id: vehicle.id });
  });

  it("VEH-14 ignores spaces around the typed plate", async () => {
    await expect(findVehicleByPlate(deps, TECHNICIAN, "  abc-123 \t")).resolves.toMatchObject({ id: vehicle.id });
  });

  it("VEH-14 reaches a vehicle that belongs to any owner", async () => {
    const found = await findVehicleByPlate(deps, TECHNICIAN, "ABC-123");

    expect(found.ownerId).toBe(OWNER_A.id);
  });

  it("matches the whole plate, never a part of it", async () => {
    await expect(findVehicleByPlate(deps, TECHNICIAN, "ABC")).rejects.toBeInstanceOf(NotFound);
    await expect(findVehicleByPlate(deps, TECHNICIAN, "ABC-1234")).rejects.toBeInstanceOf(NotFound);
    await expect(findVehicleByPlate(deps, TECHNICIAN, "ABC123")).rejects.toBeInstanceOf(NotFound);
  });

  it("VEH-15 answers an unknown plate with NotFound and the message the page shows", async () => {
    const error = await findVehicleByPlate(deps, TECHNICIAN, "ZZZ-999").catch((e) => e);

    expect(error).toBeInstanceOf(NotFound);
    expect(error.message).toBe("No vehicle found for this plate");
  });

  it("AUTH-15 refuses an owner with Forbidden, even for a plate that exists", async () => {
    await expect(findVehicleByPlate(deps, OWNER_A, "ABC-123")).rejects.toBeInstanceOf(Forbidden);
    await expect(findVehicleByPlate(deps, OWNER_A, "ZZZ-999")).rejects.toBeInstanceOf(Forbidden);
  });

  it("rejects a plate no registration could hold, before looking it up", async () => {
    const lookup = vi.spyOn(vehicles, "findByPlate");

    const tooLong = await findVehicleByPlate(deps, TECHNICIAN, "ABCDEFGHI").catch((e) => e);
    const badChars = await findVehicleByPlate(deps, TECHNICIAN, "AB C%").catch((e) => e);

    expect(tooLong).toBeInstanceOf(ValidationError);
    expect(tooLong.errors).toEqual({ form: "Plate must be at most 8 characters" });
    expect(badChars.errors).toEqual({ form: "Plate can only have letters, digits and hyphens" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("asks for a plate when the input is empty, blank or not text", async () => {
    for (const input of ["", "   ", undefined, null, 123]) {
      const error = await findVehicleByPlate(deps, TECHNICIAN, input).catch((e) => e);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({ form: "Plate is required" });
    }
  });
});
