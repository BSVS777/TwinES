import { beforeEach, describe, expect, it, vi } from "vitest";
import { Conflict, Forbidden, ValidationError } from "@/application/errors";
import { registerVehicle, type RegisterVehicleDeps } from "@/application/vehicles/register-vehicle";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, OWNER_B, REGISTRATION, TECHNICIAN } from "./fakes";

describe("registerVehicle", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: RegisterVehicleDeps;

  beforeEach(() => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles, clock: new FakeClock() };
  });

  it("VEH-01 saves the vehicle with an uppercase plate, owned by the signed-in owner", async () => {
    const vehicle = await registerVehicle(deps, OWNER_A, REGISTRATION);

    expect(vehicle).toMatchObject({
      ownerId: OWNER_A.id,
      plate: "ABC-123",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      bodyType: "sedan",
      currentMileageKm: 45000,
      purchaseDate: "2020-03-01",
    });
    expect(await vehicles.listByOwner(OWNER_A.id)).toHaveLength(1);
  });

  it("VEH-01 ignores an ownerId in the input: the vehicle always belongs to the actor", async () => {
    const vehicle = await registerVehicle(deps, OWNER_A, { ...REGISTRATION, ownerId: OWNER_B.id });

    expect(vehicle.ownerId).toBe(OWNER_A.id);
    expect(await vehicles.listByOwner(OWNER_B.id)).toEqual([]);
  });

  it("VEH-05 creates all 8 baselines at 0 km on the purchase date", async () => {
    const vehicle = await registerVehicle(deps, OWNER_A, REGISTRATION);

    expect(vehicle.baselines).toHaveLength(8);
    expect(vehicle.baselines.map((baseline) => baseline.partId)).toEqual(MAINTENANCE_CATALOG.map((part) => part.id));
    for (const baseline of vehicle.baselines) {
      expect(baseline).toMatchObject({ mileageKm: 0, date: "2020-03-01" });
    }
  });

  it("VEH-04 saves monthly mileage 1000 when it is omitted, and keeps an explicit value", async () => {
    const defaulted = await registerVehicle(deps, OWNER_A, REGISTRATION);
    const explicit = await registerVehicle(deps, OWNER_A, { ...REGISTRATION, plate: "XYZ-1", monthlyMileageKm: 0 });

    expect(defaulted.monthlyMileageKm).toBe(1000);
    expect(explicit.monthlyMileageKm).toBe(0);
  });

  it("VEH-02 rejects a plate that exists, whoever owns it and however it is cased", async () => {
    await registerVehicle(deps, OWNER_B, REGISTRATION);

    const error = await registerVehicle(deps, OWNER_A, { ...REGISTRATION, plate: " abc-123 " }).catch((e) => e);

    expect(error).toBeInstanceOf(Conflict);
    expect(error).toMatchObject({ message: "This plate is already registered", field: "plate" });
    expect(vehicles.vehicles).toHaveLength(1);
  });

  it("VEH-02 reports a plate taken between the lookup and the insert as the same conflict", async () => {
    await registerVehicle(deps, OWNER_B, REGISTRATION);
    vi.spyOn(vehicles, "findByPlate").mockResolvedValue(null);

    const error = await registerVehicle(deps, OWNER_A, REGISTRATION).catch((e) => e);

    expect(error).toBeInstanceOf(Conflict);
    expect(error).toMatchObject({ message: "This plate is already registered", field: "plate" });
  });

  it("lets other storage failures through untouched", async () => {
    const failure = new Error("disk full");
    vi.spyOn(vehicles, "create").mockRejectedValue(failure);

    await expect(registerVehicle(deps, OWNER_A, REGISTRATION)).rejects.toBe(failure);
  });

  it("VEH-03 rejects invalid fields with one message each and saves nothing", async () => {
    const error = await registerVehicle(deps, OWNER_A, { ...REGISTRATION, year: 1989, bodyType: "truck" }).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(Object.keys(error.errors).sort()).toEqual(["bodyType", "year"]);
    expect(vehicles.vehicles).toHaveLength(0);
  });

  it("VEH-03 takes today from the clock: a purchase date after it is refused, on it is accepted", async () => {
    await expect(
      registerVehicle(deps, OWNER_A, { ...REGISTRATION, purchaseDate: "2026-03-11" }),
    ).rejects.toMatchObject({ errors: { purchaseDate: "Purchase date cannot be in the future" } });
    await expect(
      registerVehicle(deps, OWNER_A, { ...REGISTRATION, purchaseDate: "2026-03-10" }),
    ).resolves.toBeDefined();
  });

  it("VEH-17 refuses a technician before reading the input", async () => {
    await expect(registerVehicle(deps, TECHNICIAN, {})).rejects.toBeInstanceOf(Forbidden);
    await expect(registerVehicle(deps, TECHNICIAN, REGISTRATION)).rejects.toBeInstanceOf(Forbidden);
    expect(vehicles.vehicles).toHaveLength(0);
  });
});
