import type { Page } from "@playwright/test";
import { seedOwnerAccount, technicianAccount } from "./support/accounts";
import { appDate, open, openOwnVehicle, registerVehicle, send, signInApi, signInUi, signUpOwner } from "./support/app";
import { expect, test } from "./support/test";

const partsList = (page: Page) => page.getByRole("list", { name: "Vehicle parts" });
const detailPanel = (page: Page) => page.getByRole("region", { name: "Part details" });
const engineOilItem = (page: Page) => partsList(page).getByRole("listitem").filter({ has: page.getByRole("button", { name: "Engine oil", exact: true }) });

/** Searches the plate in the technician's form and waits for the vehicle page. */
async function searchPlate(page: Page, plate: string) {
  await open(page, "/technician");
  await page.getByLabel("Plate").fill(plate);
  await page.getByRole("button", { name: "Search" }).click();
}

test.describe("technician flow", () => {
  test("VEH-14 a technician lands on the search page and finds a vehicle by plate in any case", async ({ page }) => {
    await signInUi(page, technicianAccount(), /\/technician$/);
    await expect(page.getByRole("heading", { name: "Find a vehicle" })).toBeVisible();

    await page.getByLabel("Plate").fill("twn-grn");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/vehicles\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "TWN-GRN" })).toBeVisible();
    await expect(partsList(page).getByRole("listitem")).toHaveCount(8);
  });

  test("VEH-15 an unknown plate shows that no vehicle was found", async ({ page }) => {
    await signInUi(page, technicianAccount(), /\/technician$/);
    await page.getByLabel("Plate").fill("ZZZ-999");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("No vehicle found for this plate");
    await expect(page).toHaveURL(/\/technician$/);
  });

  test("VIEW-08 a technician sees Mark as serviced for the selected part", async ({ page }) => {
    await signInApi(page.context().request, technicianAccount());
    await searchPlate(page, "TWN-GRN");
    await expect(page.getByRole("heading", { name: "TWN-GRN" })).toBeVisible();

    await expect(page.getByRole("button", { name: "Mark as serviced" })).toHaveCount(0);
    await partsList(page).getByRole("button", { name: "Engine oil", exact: true }).click();
    await expect(detailPanel(page).getByRole("heading", { name: "Engine oil" })).toBeVisible();
    await expect(detailPanel(page).getByRole("button", { name: "Mark as serviced" })).toBeVisible();
  });

  test("VIEW-09 an owner does not see Mark as serviced", async ({ page }) => {
    await signInApi(page.context().request, seedOwnerAccount());
    await openOwnVehicle(page, "TWN-GRN");

    await partsList(page).getByRole("button", { name: "Engine oil", exact: true }).click();
    // The panel shows the part, so the missing action is a real absence and not an empty panel.
    await expect(detailPanel(page).getByRole("heading", { name: "Engine oil" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as serviced" })).toHaveCount(0);
  });

  test("VEH-16 a technician records a serviced part: mileage and baseline update and the part turns green", async ({ page, newApi }) => {
    // The vehicle is created for this test (default baselines: nothing serviced, so every part is red).
    const owner = await newApi();
    await signUpOwner(owner);
    const vehicle = await registerVehicle(owner, { currentMileageKm: 45_000 });

    await signInApi(page.context().request, technicianAccount());
    await searchPlate(page, vehicle.plate);
    await expect(page.getByRole("heading", { name: vehicle.plate })).toBeVisible();
    await expect(engineOilItem(page)).toContainText("Red");

    await partsList(page).getByRole("button", { name: "Engine oil", exact: true }).click();
    await detailPanel(page).getByRole("button", { name: "Mark as serviced" }).click();
    await detailPanel(page).getByLabel("Current mileage (km)").fill("45200");
    await detailPanel(page).getByRole("button", { name: "Confirm service" }).click();

    await expect(detailPanel(page).getByRole("status")).toHaveText("Service recorded");
    await expect(engineOilItem(page)).toContainText("Green");
    await expect(
      page.getByRole("region", { name: vehicle.plate }).getByText("Current mileage").locator("xpath=following-sibling::dd"),
    ).toHaveText("45,200 km");
    // Other parts were not serviced.
    await expect(partsList(page).getByRole("listitem").filter({ hasText: "Brake pads" })).toContainText("Red");

    // What was stored: the new mileage and an engine oil baseline at that mileage, dated today.
    const stored = await send(owner, "GET", `/api/vehicles/${vehicle.id}`);
    const { vehicle: saved } = (await stored.json()) as {
      vehicle: { currentMileageKm: number; baselines: { partId: string; mileageKm: number; date: string }[] };
    };
    expect(saved.currentMileageKm).toBe(45_200);
    expect(saved.baselines.find((baseline) => baseline.partId === "engine-oil")).toEqual({
      partId: "engine-oil",
      mileageKm: 45_200,
      date: appDate(),
    });
    expect(saved.baselines.find((baseline) => baseline.partId === "brake-pads")?.mileageKm).toBe(0);
  });
});
