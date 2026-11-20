import { technicianAccount, uniquePlate } from "./support/accounts";
import { ORIGIN, post, registerVehicle, send, signInApi, signUpOwner } from "./support/app";
import { expect, test } from "./support/test";

const SOMEONE_ELSES = "cmzzzzzzzzzzzzzzzzzzzzzzz";

test.describe("API security", () => {
  test("AUTH-14 anonymous calls to the vehicle and technician APIs are answered with 401", async ({ request }) => {
    const calls = [
      { method: "GET", url: "/api/vehicles" },
      { method: "POST", url: "/api/vehicles", data: { plate: "ANON-1" } },
      { method: "GET", url: `/api/vehicles/${SOMEONE_ELSES}` },
      { method: "PATCH", url: `/api/vehicles/${SOMEONE_ELSES}`, data: { make: "X" } },
      { method: "DELETE", url: `/api/vehicles/${SOMEONE_ELSES}` },
      { method: "PUT", url: `/api/vehicles/${SOMEONE_ELSES}/baselines`, data: {} },
      { method: "GET", url: "/api/technician/vehicles?plate=TWN-GRN" },
      { method: "POST", url: `/api/technician/vehicles/${SOMEONE_ELSES}/service`, data: { partId: "engine-oil" } },
    ] as const;

    for (const { method, url, ...rest } of calls) {
      const response = await send(request, method, url, "data" in rest ? { data: rest.data } : {});
      expect(response.status(), `${method} ${url}`).toBe(401);
    }
  });

  test("AUTH-15 an owner gets 403 from the technician API and from the technician page", async ({ page }) => {
    // The browser context's request shares its cookies with the page.
    const request = page.context().request;
    await signUpOwner(request);
    const vehicle = await registerVehicle(request);

    const search = await send(request, "GET", "/api/technician/vehicles?plate=TWN-GRN");
    expect(search.status()).toBe(403);
    const service = await send(request, "POST", `/api/technician/vehicles/${vehicle.id}/service`, { data: { partId: "engine-oil" } });
    expect(service.status()).toBe(403);

    // The page answers a real HTTP 403, not a 200 with a notice.
    const pageResponse = await request.get("/technician");
    expect(pageResponse.status()).toBe(403);
    expect(await pageResponse.text()).toContain("Access denied");

    // The same in a browser.
    const navigation = await page.goto("/technician");
    expect(navigation?.status()).toBe(403);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  });

  test("VEH-12 and VEH-13 an owner cannot read, edit or delete another owner's vehicle (404) and it stays unchanged", async ({ newApi }) => {
    const ownerA = await newApi();
    const ownerB = await newApi();
    await signUpOwner(ownerA);
    await signUpOwner(ownerB);
    const vehicle = await registerVehicle(ownerB, { make: "Mazda", model: "3" });
    const url = `/api/vehicles/${vehicle.id}`;

    // VEH-12: read, as an API resource and as pages.
    expect((await send(ownerA, "GET", url)).status(), "GET").toBe(404);
    expect((await ownerA.get(`/vehicles/${vehicle.id}`)).status(), "health page").toBe(404);
    expect((await ownerA.get(`/vehicles/${vehicle.id}/edit`)).status(), "edit page").toBe(404);
    // VEH-13: modification.
    expect((await send(ownerA, "PATCH", url, { data: { make: "Hacked" } })).status(), "PATCH").toBe(404);
    expect((await send(ownerA, "DELETE", url)).status(), "DELETE").toBe(404);
    expect((await send(ownerA, "PUT", `${url}/baselines`, { data: { partId: "engine-oil", mileageKm: 1, date: "2020-03-02" } })).status(), "baseline").toBe(404);

    // Exactly the same answer as for a vehicle that does not exist: nothing is disclosed.
    expect((await send(ownerA, "GET", `/api/vehicles/${SOMEONE_ELSES}`)).status()).toBe(404);

    const after = await send(ownerB, "GET", url);
    expect(after.status()).toBe(200);
    const { vehicle: unchanged } = (await after.json()) as { vehicle: { make: string; model: string } };
    expect(unchanged).toMatchObject({ make: "Mazda", model: "3" });
  });

  test("VEH-17 a technician cannot edit or delete a vehicle or its baselines (403) and owner-only pages answer 403", async ({ newApi }) => {
    const owner = await newApi();
    await signUpOwner(owner);
    const vehicle = await registerVehicle(owner, { make: "Kia", model: "Rio" });
    const url = `/api/vehicles/${vehicle.id}`;

    const technician = await newApi();
    await signInApi(technician, technicianAccount());

    expect((await send(technician, "PATCH", url, { data: { make: "Hacked" } })).status(), "PATCH").toBe(403);
    expect((await send(technician, "DELETE", url)).status(), "DELETE").toBe(403);
    const baseline = { partId: "engine-oil", mileageKm: 100, date: "2020-03-02" };
    expect((await send(technician, "PUT", `${url}/baselines`, { data: baseline })).status(), "PUT baseline").toBe(403);
    expect((await send(technician, "POST", `${url}/baselines`, { data: baseline })).status(), "POST baseline").toBe(403);
    expect((await technician.get("/vehicles/new")).status(), "register page").toBe(403);
    expect((await technician.get(`${url.replace("/api", "")}/edit`)).status(), "edit page").toBe(403);

    const after = await send(owner, "GET", url);
    const { vehicle: unchanged } = (await after.json()) as {
      vehicle: { make: string; baselines: { partId: string; mileageKm: number }[] };
    };
    expect(unchanged.make).toBe("Kia");
    expect(unchanged.baselines.find((entry) => entry.partId === "engine-oil")?.mileageKm).toBe(0);
  });

  test("origin check: a foreign or missing Origin on a mutating call is refused with 403 and changes nothing", async ({ newApi }) => {
    const owner = await newApi();
    await signUpOwner(owner);
    const plate = uniquePlate();

    for (const origin of ["https://evil.example", "null", null]) {
      const response = await send(owner, "POST", "/api/vehicles", { data: vehicleBody(plate), origin });
      expect(response.status(), `POST with Origin ${origin}`).toBe(403);
    }
    const created = await send(owner, "POST", "/api/vehicles", { data: vehicleBody(plate), origin: ORIGIN });
    expect(created.status(), "the same call from the app's own origin").toBe(201);
    const { vehicle } = (await created.json()) as { vehicle: { id: string } };

    expect((await send(owner, "DELETE", `/api/vehicles/${vehicle.id}`, { origin: "https://evil.example" })).status()).toBe(403);
    expect((await send(owner, "DELETE", `/api/vehicles/${vehicle.id}`, { origin: null })).status()).toBe(403);
    expect((await send(owner, "GET", `/api/vehicles/${vehicle.id}`)).status(), "the vehicle is still there").toBe(200);

    // Sign-in is a mutating call too.
    const anonymous = await newApi();
    const signIn = await send(anonymous, "POST", "/api/auth/sign-in", {
      data: { email: "nobody@example.com", password: "irrelevant1" },
      origin: "https://evil.example",
    });
    expect(signIn.status()).toBe(403);
  });

  test("AUTH-09 the session cookie is HttpOnly and SameSite=Lax", async ({ page }) => {
    const request = page.context().request;
    const owner = await signUpOwner(request);
    const response = await post(request, "/api/auth/sign-in", owner);
    expect(response.status()).toBe(200);

    const setCookie = response.headersArray().filter((header) => header.name.toLowerCase() === "set-cookie");
    const session = setCookie.find((header) => header.value.startsWith("twines_session="));
    expect(session, "the response sets the session cookie").toBeDefined();
    expect(session!.value).toMatch(/;\s*HttpOnly/i);
    expect(session!.value).toMatch(/;\s*SameSite=Lax/i);

    // What the browser stored: flagged HttpOnly and Lax, and out of reach of page scripts.
    const stored = (await page.context().cookies()).find((cookie) => cookie.name === "twines_session");
    expect(stored).toMatchObject({ httpOnly: true, sameSite: "Lax" });
    await page.goto("/vehicles");
    expect(await page.evaluate(() => document.cookie)).not.toContain("twines_session");
  });
});

function vehicleBody(plate: string) {
  return { plate, make: "Toyota", model: "Corolla", year: 2020, bodyType: "sedan", currentMileageKm: 1000, purchaseDate: "2020-03-01" };
}
