import { beforeEach, describe, expect, it, vi } from "vitest";
import { Conflict, Forbidden, NotFound, ValidationError } from "@/application/errors";
import type { Vehicle } from "@/application/ports";
import { registerVehicle } from "@/application/vehicles/register-vehicle";
import { updateVehicle, type UpdateVehicleDeps } from "@/application/vehicles/update-vehicle";
import { FakeClock, InMemoryVehicleRepository, OWNER_A, OWNER_B, REGISTRATION, TECHNICIAN } from "./fakes";

describe("updateVehicle", () => {
  let vehicles: InMemoryVehicleRepository;
  let deps: UpdateVehicleDeps;
  let vehicle: Vehicle;

  beforeEach(async () => {
    vehicles = new InMemoryVehicleRepository();
    deps = { vehicles, clock: new FakeClock() };
    vehicle = await registerVehicle(deps, OWNER_A, REGISTRATION);
  });

  it("applies the changes the owner sends and leaves the rest alone", async () => {
    const updated = await updateVehicle(deps, OWNER_A, vehicle.id, { make: " Honda ", monthlyMileageKm: 1500 });

    expect(updated).toMatchObject({ make: "Honda", model: "Corolla", monthlyMileageKm: 1500, plate: "ABC-123" });
    expect(vehicles.vehicles[0]).toMatchObject({ make: "Honda", model: "Corolla", currentMileageKm: 45000 });
  });

  it("does not reset the monthly mileage when an edit omits it", async () => {
    await updateVehicle(deps, OWNER_A, vehicle.id, { monthlyMileageKm: 2000 });

    await updateVehicle(deps, OWNER_A, vehicle.id, { make: "Honda" });

    expect(vehicles.vehicles[0].monthlyMileageKm).toBe(2000);
  });

  it("never lets an edit change the owner or the baselines", async () => {
    await updateVehicle(deps, OWNER_A, vehicle.id, { ownerId: OWNER_B.id, baselines: [], make: "Honda" });

    expect(vehicles.vehicles[0].ownerId).toBe(OWNER_A.id);
    expect(vehicles.vehicles[0].baselines).toHaveLength(8);
  });

  describe("VEH-09 odometer rollback protection", () => {
    it("rejects a lower mileage with the field message and changes nothing", async () => {
      const error = await updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 44000, make: "Honda" }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({ currentMileageKm: "Mileage cannot be lower than the current value" });
      expect(vehicles.vehicles[0]).toMatchObject({ currentMileageKm: 45000, make: "Toyota" });
    });

    it("rejects one kilometre less but accepts the same mileage and a higher one", async () => {
      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 44999 })).rejects.toBeInstanceOf(
        ValidationError,
      );
      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 45000 })).resolves.toBeDefined();
      const raised = await updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 46000 });
      expect(raised.currentMileageKm).toBe(46000);
    });

    it("compares against the stored mileage, so a raise cannot be undone in a second edit", async () => {
      await updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 50000 });

      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 45000 })).rejects.toMatchObject({
        errors: { currentMileageKm: "Mileage cannot be lower than the current value" },
      });
    });
  });

  describe("VEH-09 a concurrent raise between the read and the write", () => {
    /** Lets the use case read the vehicle, then raises the stored mileage before it writes. */
    function raiseAfterRead(toKm: number) {
      const read = vehicles.findByIdForOwner.bind(vehicles);
      vi.spyOn(vehicles, "findByIdForOwner").mockImplementationOnce(async (id, ownerId) => {
        const seen = await read(id, ownerId);
        vehicles.vehicles[0].currentMileageKm = toKm;
        return seen;
      });
    }

    it("still rejects the stale write with the rollback message and never lowers the mileage", async () => {
      raiseAfterRead(46000);

      const error = await updateVehicle(deps, OWNER_A, vehicle.id, { currentMileageKm: 45200, make: "Honda" }).catch(
        (e) => e,
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual({ currentMileageKm: "Mileage cannot be lower than the current value" });
      expect(vehicles.vehicles[0]).toMatchObject({ currentMileageKm: 46000, make: "Toyota" });
    });

    it("answers NotFound when the vehicle is deleted between the read and the write", async () => {
      const read = vehicles.findByIdForOwner.bind(vehicles);
      vi.spyOn(vehicles, "findByIdForOwner").mockImplementationOnce(async (id, ownerId) => {
        const seen = await read(id, ownerId);
        vehicles.vehicles.length = 0;
        return seen;
      });

      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { make: "Honda" })).rejects.toBeInstanceOf(NotFound);
    });
  });

  describe("VEH-02 plate uniqueness on edit", () => {
    beforeEach(async () => {
      await registerVehicle(deps, OWNER_B, { ...REGISTRATION, plate: "TAKEN-1" });
    });

    it("rejects a plate another vehicle already has, whoever owns it", async () => {
      const error = await updateVehicle(deps, OWNER_A, vehicle.id, { plate: "taken-1" }).catch((e) => e);

      expect(error).toBeInstanceOf(Conflict);
      expect(error).toMatchObject({ message: "This plate is already registered", field: "plate" });
      expect(vehicles.vehicles[0].plate).toBe("ABC-123");
    });

    it("accepts the vehicle's own plate, in any case, and a free new plate", async () => {
      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { plate: "abc-123" })).resolves.toBeDefined();

      const renamed = await updateVehicle(deps, OWNER_A, vehicle.id, { plate: "new-9" });
      expect(renamed.plate).toBe("NEW-9");
    });

    it("reports a plate taken between the lookup and the update as the same conflict", async () => {
      vi.spyOn(vehicles, "findByPlate").mockResolvedValue(null);

      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { plate: "TAKEN-1" })).rejects.toMatchObject({
        message: "This plate is already registered",
        field: "plate",
      });
    });

    it("lets other storage failures through untouched", async () => {
      const failure = new Error("disk full");
      vi.spyOn(vehicles, "update").mockRejectedValue(failure);

      await expect(updateVehicle(deps, OWNER_A, vehicle.id, { make: "Honda" })).rejects.toBe(failure);
    });
  });

  it("VEH-03 applies the registration rules to the fields it receives", async () => {
    const error = await updateVehicle(deps, OWNER_A, vehicle.id, { year: 1989, purchaseDate: "2026-03-11" }).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(Object.keys(error.errors).sort()).toEqual(["purchaseDate", "year"]);
    expect(vehicles.vehicles[0].year).toBe(2020);
  });

  it("VEH-13 answers NotFound for another owner's vehicle and leaves it unchanged", async () => {
    await expect(updateVehicle(deps, OWNER_B, vehicle.id, { make: "Honda" })).rejects.toBeInstanceOf(NotFound);
    await expect(updateVehicle(deps, OWNER_A, "no-such-vehicle", { make: "Honda" })).rejects.toBeInstanceOf(NotFound);
    expect(vehicles.vehicles[0].make).toBe("Toyota");
  });

  it("VEH-13 checks ownership before validating, so invalid input cannot probe for existence", async () => {
    await expect(updateVehicle(deps, OWNER_B, vehicle.id, { year: 1 })).rejects.toBeInstanceOf(NotFound);
  });

  it("VEH-17 refuses a technician with Forbidden and leaves the vehicle unchanged", async () => {
    await expect(updateVehicle(deps, TECHNICIAN, vehicle.id, { make: "Honda" })).rejects.toBeInstanceOf(Forbidden);
    await expect(updateVehicle(deps, TECHNICIAN, "no-such-vehicle", {})).rejects.toBeInstanceOf(Forbidden);
    expect(vehicles.vehicles[0].make).toBe("Toyota");
  });
});
