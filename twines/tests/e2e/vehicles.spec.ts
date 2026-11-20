import type { Page } from "@playwright/test";
import { uniquePlate } from "./support/accounts";
import { appDate, open, registerVehicle, send, signUpOwner } from "./support/app";
import { expect, ownerTest as test } from "./support/test";

interface RegistrationFields {
  plate: string;
  make: string;
  model: string;
  year: string;
  bodyType: string;
  mileage: string;
  purchaseDate: string;
  monthly?: string;
}

/** Fills the registration form the way a person would and submits it. */
async function submitRegistration(page: Page, fields: RegistrationFields) {
  await open(page, "/vehicles/new");
  await page.getByLabel("Plate").fill(fields.plate);
  await page.getByLabel("Make").fill(fields.make);
  await page.getByLabel("Model").fill(fields.model);
  await page.getByLabel("Year").fill(fields.year);
  if (fields.bodyType) await page.getByLabel("Body type").selectOption(fields.bodyType);
  await page.getByLabel("Current mileage (km)").fill(fields.mileage);
  await page.getByLabel("Purchase date").fill(fields.purchaseDate);
  if (fields.monthly !== undefined) await page.getByLabel("Estimated monthly mileage (km)").fill(fields.monthly);
  await page.getByRole("button", { name: "Register vehicle" }).click();
}

const valid = (plate: string): RegistrationFields => ({
  plate,
  make: "Toyota",
  model: "Corolla",
  year: "2020",
  bodyType: "sedan",
  mileage: "45000",
  purchaseDate: "2020-03-01",
});

test.describe("vehicle registry", () => {
  test("VEH-01 an owner registers a vehicle: the plate is stored uppercase and it appears in their list", async ({ page }) => {
    const plate = uniquePlate();
    await submitRegistration(page, { ...valid(plate.toLowerCase()), monthly: "1500" });

    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(page.getByRole("link", { name: `${plate} Toyota Corolla 2020` })).toBeVisible();
    await expect(page.getByText("45,000 km")).toBeVisible();
  });

  test("VEH-04 an empty monthly mileage is saved as 1,000 km", async ({ page }) => {
    const plate = uniquePlate();
    await submitRegistration(page, valid(plate));
    await expect(page).toHaveURL(/\/vehicles$/);

    await page.getByRole("link", { name: `Edit ${plate}` }).click();
    await expect(page.getByLabel("Estimated monthly mileage (km)")).toHaveValue("1000");
  });

  test("VEH-02 a plate that is already registered is rejected, whoever owns it", async ({ page, newApi }) => {
    const other = await newApi();
    await signUpOwner(other);
    const taken = await registerVehicle(other);

    await submitRegistration(page, valid(taken.plate.toLowerCase()));
    await expect(page.getByLabel("Plate")).toHaveAccessibleDescription("This plate is already registered");
    await expect(page).toHaveURL(/\/vehicles\/new$/);

    await page.goto("/vehicles");
    await expect(page.getByText("You have no vehicles yet")).toBeVisible();
  });

  test("VEH-03 every invalid field shows its own message and nothing is saved", async ({ page, context }) => {
    await submitRegistration(page, {
      plate: "ABCDEFGHI",
      make: "Toyota",
      model: "Corolla",
      year: "1989",
      bodyType: "",
      mileage: "-1",
      purchaseDate: appDate(2),
    });

    await expect(page.getByLabel("Plate")).toHaveAccessibleDescription("Plate must be at most 8 characters");
    await expect(page.getByLabel("Year")).toHaveAccessibleDescription("Year must be 1990 or later");
    await expect(page.getByLabel("Body type")).toHaveAccessibleDescription("Body type must be sedan, hatchback, suv or pickup");
    await expect(page.getByLabel("Current mileage (km)")).toHaveAccessibleDescription("Mileage cannot be negative");
    await expect(page.getByLabel("Purchase date")).toHaveAccessibleDescription("Purchase date cannot be in the future");
    // Fields that are valid stay quiet.
    await expect(page.getByLabel("Make")).not.toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/vehicles\/new$/);

    // A body type outside the list cannot be picked in the form; the API refuses it with its own message.
    const truck = await send(context.request, "POST", "/api/vehicles", {
      data: { ...valid("TRUCK-1"), year: 2020, currentMileageKm: 1000, bodyType: "truck" },
    });
    expect(truck.status()).toBe(400);
    expect(await truck.json()).toMatchObject({ errors: { bodyType: "Body type must be sedan, hatchback, suv or pickup" } });

    const list = await send(context.request, "GET", "/api/vehicles");
    expect(await list.json()).toEqual({ vehicles: [] });
  });

  test("VEH-08 an owner sees only their own vehicles", async ({ page, newApi }) => {
    const request = page.context().request;
    const mine = [await registerVehicle(request), await registerVehicle(request)];
    const other = await newApi();
    await signUpOwner(other);
    const theirs = await registerVehicle(other);

    await open(page, "/vehicles");
    const items = page.getByRole("main").getByRole("listitem");
    await expect(items).toHaveCount(2);
    for (const vehicle of mine) await expect(items.filter({ hasText: vehicle.plate })).toHaveCount(1);
    await expect(page.getByText(theirs.plate)).toHaveCount(0);
  });

  test("VEH-09 mileage cannot decrease; a higher reading is saved", async ({ page }) => {
    const vehicle = await registerVehicle(page.context().request, { currentMileageKm: 45_000 });
    await open(page, `/vehicles/${vehicle.id}/edit`);

    const mileage = page.getByLabel("Current mileage (km)");
    await mileage.fill("44000");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(mileage).toHaveAccessibleDescription("Mileage cannot be lower than the current value");
    await expect(page).toHaveURL(/\/edit$/);

    await mileage.fill("46000");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(page.getByText("46,000 km")).toBeVisible();
  });

  test("VEH-10 deleting asks for confirmation, then removes the vehicle", async ({ page }) => {
    const request = page.context().request;
    const vehicle = await registerVehicle(request);
    await open(page, `/vehicles/${vehicle.id}/edit`);

    // The first click only asks; cancelling leaves the vehicle alone.
    await page.getByRole("button", { name: "Delete vehicle" }).click();
    const confirmation = page.getByRole("group", { name: "Confirm deletion" });
    await expect(confirmation).toContainText(vehicle.plate);
    await confirmation.getByRole("button", { name: "Cancel" }).click();
    await expect(confirmation).toBeHidden();
    expect((await send(request, "GET", `/api/vehicles/${vehicle.id}`)).status()).toBe(200);

    await page.getByRole("button", { name: "Delete vehicle" }).click();
    await page.getByRole("button", { name: "Yes, delete vehicle" }).click();
    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(page.getByText("You have no vehicles yet")).toBeVisible();
    await expect(page.getByText(vehicle.plate)).toHaveCount(0);
    expect((await send(request, "GET", `/api/vehicles/${vehicle.id}`)).status()).toBe(404);
  });

  test("VEH-11 an owner without vehicles sees the empty state with a register action", async ({ page }) => {
    await open(page, "/vehicles");
    await expect(page.getByText("You have no vehicles yet")).toBeVisible();
    await page.getByRole("link", { name: "Register vehicle" }).click();
    await expect(page).toHaveURL(/\/vehicles\/new$/);
    await expect(page.getByRole("heading", { name: "Register vehicle" })).toBeVisible();
  });
});
