import type { Locator, Page } from "@playwright/test";
import { SEED_EXPECTATIONS } from "../../prisma/seed-data";
import { MAINTENANCE_CATALOG } from "../../src/domain/part-health/catalog";
import { seedOwnerAccount } from "./support/accounts";
import { openOwnVehicle, send, signInApi } from "./support/app";
import { expect, test } from "./support/test";

const STATUS_LABEL = { green: "Green", yellow: "Yellow", orange: "Orange", red: "Red" } as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

test.beforeEach(async ({ page }) => {
  await signInApi(page.context().request, seedOwnerAccount());
});

const partsList = (page: Page) => page.getByRole("list", { name: "Vehicle parts" });
const detailPanel = (page: Page) => page.getByRole("region", { name: "Part details" });
const model3D = (page: Page) => page.getByRole("group", { name: "Vehicle 3D model" });

/** The part's hotspot on the 3D model (its accessible name carries the status). */
const hotspot = (page: Page, name: string, status: keyof typeof STATUS_LABEL) =>
  model3D(page).getByRole("button", { name: `${name}: ${STATUS_LABEL[status]}` });

/** Where an element is on screen, rounded to a pixel; a rotating model moves its hotspots. */
async function position(target: Locator): Promise<string> {
  const box = await target.boundingBox();
  return box ? `${Math.round(box.x)},${Math.round(box.y)}` : "hidden";
}

test.describe("vehicle health view", () => {
  test("VIEW-01 the summary shows the vehicle, its overall status, the next maintenance and the generic-intervals notice", async ({ page }) => {
    const id = await openOwnVehicle(page, "TWN-ORG");
    const summary = page.getByRole("region", { name: "TWN-ORG" });

    await expect(summary).toContainText("Hyundai Tucson 2020");
    await expect(summary.getByText("73,000 km")).toBeVisible();
    await expect(summary.getByText("Overall status").locator("xpath=following-sibling::dd")).toHaveText(
      STATUS_LABEL[SEED_EXPECTATIONS["TWN-ORG"].overallStatus],
    );

    // The next maintenance: a real date, an estimated mileage and the grouped parts, as the API computes them.
    const api = await send(page.context().request, "GET", `/api/vehicles/${id}`);
    const { nextMaintenance } = (await api.json()) as {
      nextMaintenance: { date: string; overdue: boolean; parts: string[]; estimatedMileageKm: number };
    };
    expect(nextMaintenance.date).toMatch(DATE);
    expect(nextMaintenance.overdue).toBe(SEED_EXPECTATIONS["TWN-ORG"].nextMaintenanceOverdue);
    const next = summary.getByRole("heading", { name: "Next maintenance" }).locator("xpath=following-sibling::dl[1]");
    await expect(next).toContainText(nextMaintenance.date);
    await expect(next).toContainText(`${nextMaintenance.estimatedMileageKm.toLocaleString("en-US")} km`);
    for (const partId of nextMaintenance.parts) {
      const name = MAINTENANCE_CATALOG.find((part) => part.id === partId)?.name ?? "";
      await expect(next).toContainText(name);
    }
    await expect(next).not.toContainText("Overdue");

    await expect(summary).toContainText("Maintenance intervals are generic estimates, not manufacturer data.");
  });

  test("VIEW-01 an overdue next maintenance is flagged", async ({ page }) => {
    await openOwnVehicle(page, "TWN-RED");
    const summary = page.getByRole("region", { name: "TWN-RED" });
    await expect(summary.getByText("Overall status").locator("xpath=following-sibling::dd")).toHaveText("Red");
    expect(SEED_EXPECTATIONS["TWN-RED"].nextMaintenanceOverdue).toBe(true);
    await expect(summary.getByText("Overdue").first()).toBeVisible();
  });

  for (const plate of ["TWN-ORG", "TWN-RED"]) {
    test(`VIEW-02 ${plate} lists 8 parts, each with its name, status as text and usage percentage`, async ({ page }) => {
      await openOwnVehicle(page, plate);
      const items = partsList(page).getByRole("listitem");
      await expect(items).toHaveCount(8);

      for (const [index, part] of MAINTENANCE_CATALOG.entries()) {
        const item = items.nth(index);
        const expected = STATUS_LABEL[SEED_EXPECTATIONS[plate].parts[part.id]];
        await expect(item.getByRole("button", { name: part.name, exact: true })).toBeVisible();
        await expect(item, part.name).toContainText(expected);
        for (const other of Object.values(STATUS_LABEL).filter((label) => label !== expected)) {
          await expect(item, `${part.name} is not ${other}`).not.toContainText(other);
        }
        await expect(item).toContainText(/\d+% used/);
      }
    });
  }

  test("VIEW-04 and VIEW-05 selecting a part in the list shows its details, and the model highlights it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openOwnVehicle(page, "TWN-ORG");
    await expect(detailPanel(page)).toContainText("Select a part to see its details.");

    await partsList(page).getByRole("button", { name: "Brake pads", exact: true }).click();
    await expect(detailPanel(page).getByRole("heading", { name: "Brake pads" })).toBeVisible();
    await expect(detailPanel(page)).toContainText("Orange");
    await expect(detailPanel(page)).toContainText(/\d+%/);
    await expect(detailPanel(page)).toContainText(/(km left|km overdue)/);
    await expect(detailPanel(page)).toContainText(/(days? left|days? overdue)/);
    await expect(detailPanel(page).getByText(DATE)).toBeVisible();
    await expect(hotspot(page, "Brake pads", "orange")).toHaveAttribute("aria-pressed", "true");

    // VIEW-05: another part from the list replaces the panel and moves the highlight.
    await partsList(page).getByRole("button", { name: "Engine oil", exact: true }).click();
    await expect(detailPanel(page).getByRole("heading", { name: "Engine oil" })).toBeVisible();
    await expect(hotspot(page, "Engine oil", "green")).toHaveAttribute("aria-pressed", "true");
    await expect(hotspot(page, "Brake pads", "orange")).toHaveAttribute("aria-pressed", "false");
  });

  test("VIEW-04 clicking a part zone on the 3D model opens its details", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openOwnVehicle(page, "TWN-ORG");

    await expect(model3D(page).locator("canvas")).toBeVisible();
    await hotspot(page, "Brake pads", "orange").click();
    await expect(detailPanel(page).getByRole("heading", { name: "Brake pads" })).toBeVisible();
    await expect(detailPanel(page)).toContainText("Orange");
    await expect(detailPanel(page)).toContainText(/\d+%/);
    await expect(detailPanel(page).getByText(DATE)).toBeVisible();
  });

  test("VIEW-04 the rotating model pauses when a part zone is clicked", async ({ page }) => {
    await openOwnVehicle(page, "TWN-ORG");
    await expect(model3D(page).locator("canvas")).toBeVisible();
    const tires = hotspot(page, "Tires", "green");
    await expect(tires).toBeAttached();

    // Rotating: the hotspot's screen position keeps changing. (A click cannot target a moving
    // element, so the zone is activated with a dispatched click, which is what the button handles.)
    const rotating = await position(tires);
    await expect.poll(() => position(tires), { message: "the model rotates", intervals: [300] }).not.toBe(rotating);

    await hotspot(page, "Brake pads", "orange").dispatchEvent("click");
    await expect(detailPanel(page).getByRole("heading", { name: "Brake pads" })).toBeVisible();

    // The orbit controls ease to a stop; once settled the position no longer changes.
    await page.waitForTimeout(2000);
    const settled = await position(tires);
    await page.waitForTimeout(1000);
    expect(await position(tires), "the model stays still after a selection").toBe(settled);
  });

  test("VIEW-06 without WebGL a 2D diagram with 8 colored zones is shown and the page has no errors", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`console: ${message.text()}`);
    });
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (/webgl/i.test(type)) return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });

    await openOwnVehicle(page, "TWN-ORG");
    const diagram = page.getByRole("group", { name: "Vehicle diagram" });
    await expect(diagram).toBeVisible();
    await expect(model3D(page)).toHaveCount(0);

    const zones = diagram.getByRole("button");
    await expect(zones).toHaveCount(8);
    for (const part of MAINTENANCE_CATALOG) {
      const status = SEED_EXPECTATIONS["TWN-ORG"].parts[part.id];
      const zone = diagram.getByRole("button", { name: `${part.name}: ${STATUS_LABEL[status]}` });
      await expect(zone).toHaveAttribute("data-status", status);
    }

    // The zones are clickable, like the 3D hotspots.
    await diagram.getByRole("button", { name: "Brake pads: Orange" }).click();
    await expect(detailPanel(page).getByRole("heading", { name: "Brake pads" })).toBeVisible();
    expect(problems, "no page or console errors").toEqual([]);
  });

  test("VIEW-07 with reduced motion the model is shown without auto-rotation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openOwnVehicle(page, "TWN-ORG");
    await expect(model3D(page).locator("canvas")).toBeVisible();

    const tires = hotspot(page, "Tires", "green");
    await expect(tires).toBeAttached();
    // Let the first frames and the controls' damping settle, then watch for a second.
    await page.waitForTimeout(1500);
    const first = await position(tires);
    for (let sample = 0; sample < 4; sample++) {
      await page.waitForTimeout(300);
      expect(await position(tires), `sample ${sample + 1}`).toBe(first);
    }
  });
});
