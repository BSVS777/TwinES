import { beforeEach, describe, expect, it } from "vitest";
import type { PublicUser } from "@/application/ports";
import { createTechnicianHandlers } from "@/infrastructure/http/technician-handlers";
import { createVehicleHandlers } from "@/infrastructure/http/vehicle-handlers";
import {
  FakeClock,
  FakeSessionTokens,
  InMemorySessionStore,
  InMemoryUserRepository,
} from "../../application/auth/fakes";
import { InMemoryVehicleRepository, REGISTRATION } from "../../application/vehicles/fakes";

const ORIGIN = "http://localhost:3000";
const SESSION_TTL_MS = 60 * 60 * 1000;

describe("technician route handlers", () => {
  let users: InMemoryUserRepository;
  let sessions: InMemorySessionStore;
  let vehicles: InMemoryVehicleRepository;
  let handlers: ReturnType<typeof createTechnicianHandlers>;
  let vehicleHandlers: ReturnType<typeof createVehicleHandlers>;
  let owner: PublicUser;
  let technician: PublicUser;
  let vehicleId: string;
  const cookies = new Map<string, string>();

  async function signedIn(email: string, role: "owner" | "technician"): Promise<PublicUser> {
    const user = await users.create({ email, passwordHash: "x", role });
    const token = `token-${user.id}`;
    await sessions.create({
      tokenHash: new FakeSessionTokens().hash(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    cookies.set(user.id, `twines_session=${token}`);
    return { id: user.id, email: user.email, role: user.role };
  }

  function request(
    method: string,
    path: string,
    options: { as?: PublicUser | null; body?: unknown; origin?: string | null; cookie?: string } = {},
  ): Request {
    const { as = technician, body, origin = ORIGIN, cookie } = options;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (origin !== null) headers.origin = origin;
    const sessionCookie = cookie ?? (as ? cookies.get(as.id) : undefined);
    if (sessionCookie) headers.cookie = sessionCookie;
    return new Request(`${ORIGIN}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  const search = (plate: string, options: Parameters<typeof request>[2] = {}) =>
    handlers.findByPlate(request("GET", `/api/technician/vehicles?plate=${encodeURIComponent(plate)}`, options));

  const service = (body: unknown, options: Parameters<typeof request>[2] = {}, id = vehicleId) =>
    handlers.recordService(request("POST", `/api/technician/vehicles/${id}/service`, { body, ...options }), id);

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    sessions = new InMemorySessionStore(users);
    vehicles = new InMemoryVehicleRepository();
    cookies.clear();
    const deps = { sessions, tokens: new FakeSessionTokens(), clock: new FakeClock(), vehicles };
    handlers = createTechnicianHandlers(deps);
    vehicleHandlers = createVehicleHandlers(deps);
    owner = await signedIn("a@example.com", "owner");
    technician = await signedIn("tech@example.com", "technician");
    const created = await vehicleHandlers.register(request("POST", "/api/vehicles", { as: owner, body: REGISTRATION }));
    vehicleId = (await created.json()).vehicle.id;
  });

  describe("AUTH-14 anonymous requests", () => {
    it("GET /api/technician/vehicles answers 401 without a session cookie", async () => {
      const response = await search("abc-123", { as: null });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Authentication required" });
    });

    it("POST /api/technician/vehicles/:id/service answers 401 without a session cookie and changes nothing", async () => {
      const response = await service({ partId: "engine-oil" }, { as: null });

      expect(response.status).toBe(401);
      expect(vehicles.vehicles[0].baselines.every((baseline) => baseline.mileageKm === 0)).toBe(true);
    });

    it("answers 401 for a cookie that matches no session", async () => {
      expect((await search("abc-123", { as: null, cookie: "twines_session=forged" })).status).toBe(401);
      expect((await service({ partId: "engine-oil" }, { as: null, cookie: "twines_session=forged" })).status).toBe(401);
    });
  });

  describe("AUTH-15 owners", () => {
    it("answers 403 to an owner searching by plate, even for a plate that exists", async () => {
      const response = await search("abc-123", { as: owner });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Only technicians can search vehicles by plate" });
    });

    it("answers 403 to an owner recording a service on their own vehicle and changes nothing", async () => {
      const response = await service({ partId: "engine-oil", currentMileageKm: 45200 }, { as: owner });

      expect(response.status).toBe(403);
      expect(vehicles.vehicles[0].currentMileageKm).toBe(45000);
      expect(vehicles.vehicles[0].baselines.every((baseline) => baseline.mileageKm === 0)).toBe(true);
    });
  });

  describe("cross-site writes", () => {
    it("refuses a foreign Origin with 403 and changes nothing", async () => {
      const response = await service({ partId: "engine-oil" }, { origin: "https://evil.example" });

      expect(response.status).toBe(403);
      expect(vehicles.vehicles[0].baselines.every((baseline) => baseline.mileageKm === 0)).toBe(true);
    });

    it("refuses a request without Origin with 403", async () => {
      expect((await service({ partId: "engine-oil" }, { origin: null })).status).toBe(403);
    });

    it("lets the search through without an Origin header", async () => {
      expect((await search("abc-123", { origin: null })).status).toBe(200);
    });
  });

  describe("GET /api/technician/vehicles?plate=", () => {
    it("VEH-14 answers 200 with the vehicle id and plate whatever the case of the typed plate", async () => {
      const response = await search("abc-123");

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: vehicleId, plate: "ABC-123" });
    });

    it("never exposes the owner or other internals", async () => {
      const text = await (await search("abc-123")).text();

      expect(text).not.toContain("ownerId");
      expect(text).not.toContain(owner.id);
    });

    it("VEH-15 answers 404 with the not-found message for an unknown plate", async () => {
      const response = await search("ZZZ-999");

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "No vehicle found for this plate" });
    });

    it("answers 400 when the plate is missing or blank", async () => {
      const missing = await handlers.findByPlate(request("GET", "/api/technician/vehicles"));
      const blank = await search("   ");

      expect(missing.status).toBe(400);
      expect(await missing.json()).toEqual({ errors: { form: "Plate is required" } });
      expect(blank.status).toBe(400);
    });
  });

  describe("POST /api/technician/vehicles/:id/service", () => {
    it("VEH-16 answers 200 with the recomputed health: mileage updated, part green", async () => {
      const response = await service({ partId: "engine-oil", currentMileageKm: 45200 });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.vehicle).toMatchObject({ id: vehicleId, plate: "ABC-123", currentMileageKm: 45200 });
      expect(body.health.find((part: { partId: string }) => part.partId === "engine-oil").status).toBe("green");
      expect(Object.keys(body).sort()).toEqual(["dues", "health", "nextMaintenance", "overallStatus", "vehicle"]);
      expect(body.vehicle.baselines).toContainEqual({ partId: "engine-oil", mileageKm: 45200, date: "2026-03-10" });
    });

    it("has the same shape as GET /api/vehicles/:id, and the owner sees the new state", async () => {
      const response = await service({ partId: "engine-oil", currentMileageKm: 45200 });
      const ownerView = await vehicleHandlers.get(request("GET", `/api/vehicles/${vehicleId}`, { as: owner }), vehicleId);

      expect(await response.json()).toEqual(await ownerView.json());
      expect(vehicles.vehicles[0].currentMileageKm).toBe(45200);
    });

    it("never exposes the owner id", async () => {
      const text = await (await service({ partId: "engine-oil" })).text();

      expect(text).not.toContain("ownerId");
    });

    it("answers 200 and keeps the mileage when none is given", async () => {
      const response = await service({ partId: "engine-oil" });

      expect(response.status).toBe(200);
      expect(vehicles.vehicles[0].currentMileageKm).toBe(45000);
    });

    it("VEH-09 answers 400 with the rollback message for a lower mileage and changes nothing", async () => {
      const response = await service({ partId: "engine-oil", currentMileageKm: 44000 });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ errors: { currentMileageKm: "Mileage cannot be lower than the current value" } });
      expect(vehicles.vehicles[0].currentMileageKm).toBe(45000);
      expect(vehicles.vehicles[0].baselines.every((baseline) => baseline.mileageKm === 0)).toBe(true);
    });

    it("answers 400 for an unknown part", async () => {
      const response = await service({ partId: "wipers" });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ errors: { partId: "Part must be one of the 8 tracked parts" } });
    });

    it("answers 400 for a body that is not JSON", async () => {
      expect((await service("not json{")).status).toBe(400);
    });

    it("answers 404 for an unknown vehicle", async () => {
      const response = await service({ partId: "engine-oil" }, {}, "no-such-vehicle");

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Vehicle not found" });
    });
  });

  describe("VEH-17 technicians still cannot edit or delete", () => {
    it("answers 403 to a technician editing or deleting and leaves the vehicle unchanged", async () => {
      const patch = await vehicleHandlers.update(
        request("PATCH", `/api/vehicles/${vehicleId}`, { body: { make: "Honda" } }),
        vehicleId,
      );
      const remove = await vehicleHandlers.remove(request("DELETE", `/api/vehicles/${vehicleId}`), vehicleId);

      expect([patch.status, remove.status]).toEqual([403, 403]);
      expect(vehicles.vehicles).toHaveLength(1);
      expect(vehicles.vehicles[0].make).toBe("Toyota");
    });
  });
});
