import { beforeEach, describe, expect, it } from "vitest";
import type { PublicUser } from "@/application/ports";
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

type Handlers = ReturnType<typeof createVehicleHandlers>;

describe("vehicle route handlers", () => {
  let users: InMemoryUserRepository;
  let sessions: InMemorySessionStore;
  let vehicles: InMemoryVehicleRepository;
  let handlers: Handlers;
  let owner: PublicUser;
  let otherOwner: PublicUser;
  let technician: PublicUser;
  const cookies = new Map<string, string>();

  /** Creates the user and a live session for them, and remembers the cookie that carries it. */
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
    const { as = owner, body, origin = ORIGIN, cookie } = options;
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

  async function seedVehicle(as: PublicUser, plate = "abc-123") {
    const response = await handlers.register(request("POST", "/api/vehicles", { as, body: { ...REGISTRATION, plate } }));
    return (await response.json()).vehicle as { id: string; plate: string };
  }

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    sessions = new InMemorySessionStore(users);
    vehicles = new InMemoryVehicleRepository();
    cookies.clear();
    handlers = createVehicleHandlers({ sessions, tokens: new FakeSessionTokens(), clock: new FakeClock(), vehicles });
    owner = await signedIn("a@example.com", "owner");
    otherOwner = await signedIn("b@example.com", "owner");
    technician = await signedIn("tech@example.com", "technician");
  });

  describe("AUTH-14 anonymous requests", () => {
    const calls: Array<[string, (h: Handlers, r: Request) => Promise<Response>, string, string]> = [
      ["GET /api/vehicles", (h, r) => h.list(r), "GET", "/api/vehicles"],
      ["POST /api/vehicles", (h, r) => h.register(r), "POST", "/api/vehicles"],
      ["GET /api/vehicles/:id", (h, r) => h.get(r, "vehicle-1"), "GET", "/api/vehicles/vehicle-1"],
      ["PATCH /api/vehicles/:id", (h, r) => h.update(r, "vehicle-1"), "PATCH", "/api/vehicles/vehicle-1"],
      ["DELETE /api/vehicles/:id", (h, r) => h.remove(r, "vehicle-1"), "DELETE", "/api/vehicles/vehicle-1"],
      [
        "PUT /api/vehicles/:id/baselines",
        (h, r) => h.setBaseline(r, "vehicle-1"),
        "PUT",
        "/api/vehicles/vehicle-1/baselines",
      ],
    ];

    it.each(calls)("%s answers 401 without a session cookie", async (_name, call, method, path) => {
      const body = method === "GET" || method === "DELETE" ? undefined : {};
      const response = await call(handlers, request(method, path, { as: null, body }));

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Authentication required" });
    });

    it.each(calls)("%s answers 401 for a cookie that matches no session", async (_name, call, method, path) => {
      const body = method === "GET" || method === "DELETE" ? undefined : {};
      const response = await call(handlers, request(method, path, { as: null, cookie: "twines_session=forged", body }));

      expect(response.status).toBe(401);
    });

    it("never creates a vehicle for an anonymous request", async () => {
      await handlers.register(request("POST", "/api/vehicles", { as: null, body: REGISTRATION }));

      expect(vehicles.vehicles).toHaveLength(0);
    });
  });

  describe("cross-site writes", () => {
    it("refuses a foreign Origin with 403 on every mutating endpoint and changes nothing", async () => {
      const { id } = await seedVehicle(owner);
      const foreign = { origin: "https://evil.example", body: { make: "Hacked", mileageKm: 1 } };

      const responses = await Promise.all([
        handlers.register(request("POST", "/api/vehicles", { ...foreign, body: { ...REGISTRATION, plate: "zzz-1" } })),
        handlers.update(request("PATCH", `/api/vehicles/${id}`, foreign), id),
        handlers.remove(request("DELETE", `/api/vehicles/${id}`, foreign), id),
        handlers.setBaseline(request("PUT", `/api/vehicles/${id}/baselines`, foreign), id),
      ]);

      expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403]);
      expect(vehicles.vehicles).toHaveLength(1);
      expect(vehicles.vehicles[0].make).toBe("Toyota");
    });

    it("refuses a mutating request without Origin with 403", async () => {
      const response = await handlers.register(request("POST", "/api/vehicles", { origin: null, body: REGISTRATION }));

      expect(response.status).toBe(403);
      expect(vehicles.vehicles).toHaveLength(0);
    });

    it("lets reads through without an Origin header", async () => {
      const response = await handlers.list(request("GET", "/api/vehicles", { origin: null }));

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/vehicles", () => {
    it("VEH-01 answers 201 with the vehicle saved uppercase and owned by the signed-in owner", async () => {
      const response = await handlers.register(request("POST", "/api/vehicles", { body: REGISTRATION }));
      const { vehicle } = await response.json();

      expect(response.status).toBe(201);
      expect(vehicle).toMatchObject({ plate: "ABC-123", make: "Toyota", model: "Corolla", year: 2020 });
      expect(vehicles.vehicles[0].ownerId).toBe(owner.id);
      const list = await (await handlers.list(request("GET", "/api/vehicles"))).json();
      expect(list.vehicles.map((v: { id: string }) => v.id)).toEqual([vehicle.id]);
    });

    it("VEH-04 defaults the monthly mileage to 1000", async () => {
      const { vehicle } = await (await handlers.register(request("POST", "/api/vehicles", { body: REGISTRATION }))).json();

      expect(vehicle.monthlyMileageKm).toBe(1000);
    });

    it("never exposes the owner id or any user internals, and ignores an owner id in the body", async () => {
      const response = await handlers.register(
        request("POST", "/api/vehicles", { body: { ...REGISTRATION, ownerId: otherOwner.id } }),
      );
      const text = await response.text();

      expect(text).not.toContain("ownerId");
      expect(text).not.toContain("passwordHash");
      expect(vehicles.vehicles[0].ownerId).toBe(owner.id);
    });

    it("VEH-02 answers 409 with the duplicate plate message under the plate field", async () => {
      await seedVehicle(otherOwner);

      const response = await handlers.register(request("POST", "/api/vehicles", { body: REGISTRATION }));

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ errors: { plate: "This plate is already registered" } });
      expect(vehicles.vehicles).toHaveLength(1);
    });

    it("VEH-03 answers 400 with one message per invalid field", async () => {
      const response = await handlers.register(
        request("POST", "/api/vehicles", {
          body: {
            ...REGISTRATION,
            plate: "ABCDEFGHI",
            year: 1989,
            bodyType: "truck",
            currentMileageKm: -1,
            purchaseDate: "2026-03-11",
          },
        }),
      );
      const { errors } = await response.json();

      expect(response.status).toBe(400);
      expect(Object.keys(errors).sort()).toEqual(["bodyType", "currentMileageKm", "plate", "purchaseDate", "year"]);
      expect(vehicles.vehicles).toHaveLength(0);
    });

    it("answers 400 for a body that is not JSON", async () => {
      const response = await handlers.register(request("POST", "/api/vehicles", { body: "not json" }));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ errors: { form: "Invalid input" } });
    });

    it("VEH-17 answers 403 for a technician and saves nothing", async () => {
      const response = await handlers.register(request("POST", "/api/vehicles", { as: technician, body: REGISTRATION }));

      expect(response.status).toBe(403);
      expect(vehicles.vehicles).toHaveLength(0);
    });
  });

  describe("GET /api/vehicles", () => {
    it("VEH-08 lists only the signed-in owner's vehicles", async () => {
      await seedVehicle(owner, "aaa-111");
      await seedVehicle(owner, "aaa-222");
      await seedVehicle(otherOwner, "bbb-111");

      const response = await handlers.list(request("GET", "/api/vehicles"));
      const { vehicles: listed } = await response.json();

      expect(response.status).toBe(200);
      expect(listed.map((v: { plate: string }) => v.plate).sort()).toEqual(["AAA-111", "AAA-222"]);
    });

    it("answers an empty list for an owner without vehicles", async () => {
      await seedVehicle(owner);

      const response = await handlers.list(request("GET", "/api/vehicles", { as: otherOwner }));

      expect(await response.json()).toEqual({ vehicles: [] });
    });
  });

  describe("GET /api/vehicles/:id", () => {
    it("answers 200 with the vehicle and its health for the owner", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.get(request("GET", `/api/vehicles/${id}`), id);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.vehicle).toMatchObject({ id, plate: "ABC-123" });
      expect(body.health).toHaveLength(8);
      expect(body.dues).toHaveLength(8);
      expect(["green", "yellow", "orange", "red"]).toContain(body.overallStatus);
      expect(body.nextMaintenance.parts.length).toBeGreaterThan(0);
      expect(JSON.stringify(body)).not.toContain("ownerId");
    });

    it("lets a technician read any vehicle", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.get(request("GET", `/api/vehicles/${id}`, { as: technician }), id);

      expect(response.status).toBe(200);
    });

    it("VEH-12 answers 404 for another owner's vehicle exactly as for one that does not exist", async () => {
      const { id } = await seedVehicle(otherOwner);

      const foreign = await handlers.get(request("GET", `/api/vehicles/${id}`), id);
      const missing = await handlers.get(request("GET", "/api/vehicles/nope"), "nope");

      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(await foreign.json()).toEqual(await missing.json());
    });
  });

  describe("PATCH /api/vehicles/:id", () => {
    it("answers 200 with the updated vehicle", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.update(
        request("PATCH", `/api/vehicles/${id}`, { body: { currentMileageKm: 46000 } }),
        id,
      );

      expect(response.status).toBe(200);
      expect((await response.json()).vehicle.currentMileageKm).toBe(46000);
      expect(vehicles.vehicles[0].currentMileageKm).toBe(46000);
    });

    it("VEH-09 answers 400 when the mileage would go down", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.update(
        request("PATCH", `/api/vehicles/${id}`, { body: { currentMileageKm: 44000 } }),
        id,
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        errors: { currentMileageKm: "Mileage cannot be lower than the current value" },
      });
      expect(vehicles.vehicles[0].currentMileageKm).toBe(45000);
    });

    it("answers 409 under the plate field when the new plate belongs to another vehicle", async () => {
      await seedVehicle(otherOwner, "bbb-111");
      const { id } = await seedVehicle(owner);

      const response = await handlers.update(request("PATCH", `/api/vehicles/${id}`, { body: { plate: "bbb-111" } }), id);

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ errors: { plate: "This plate is already registered" } });
    });

    it("VEH-13 answers 404 for another owner's vehicle and leaves it unchanged", async () => {
      const { id } = await seedVehicle(otherOwner);

      const response = await handlers.update(request("PATCH", `/api/vehicles/${id}`, { body: { make: "Hacked" } }), id);

      expect(response.status).toBe(404);
      expect(vehicles.vehicles[0].make).toBe("Toyota");
    });

    it("VEH-17 answers 403 for a technician and leaves the vehicle unchanged", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.update(
        request("PATCH", `/api/vehicles/${id}`, { as: technician, body: { make: "Hacked" } }),
        id,
      );

      expect(response.status).toBe(403);
      expect(vehicles.vehicles[0].make).toBe("Toyota");
    });
  });

  describe("DELETE /api/vehicles/:id", () => {
    it("VEH-10 answers 204 without a body and removes the vehicle", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.remove(request("DELETE", `/api/vehicles/${id}`), id);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
      expect(vehicles.vehicles).toHaveLength(0);
    });

    it("VEH-13 answers 404 for another owner's vehicle and keeps it", async () => {
      const { id } = await seedVehicle(otherOwner);

      const response = await handlers.remove(request("DELETE", `/api/vehicles/${id}`), id);

      expect(response.status).toBe(404);
      expect(vehicles.vehicles).toHaveLength(1);
    });

    it("VEH-17 answers 403 for a technician and keeps the vehicle", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.remove(request("DELETE", `/api/vehicles/${id}`, { as: technician }), id);

      expect(response.status).toBe(403);
      expect(vehicles.vehicles).toHaveLength(1);
    });
  });

  describe("PUT /api/vehicles/:id/baselines", () => {
    const baseline = { partId: "engine-oil", mileageKm: 42000, date: "2026-03-01" };

    it("VEH-06 answers 200 and saves the baseline", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.setBaseline(request("PUT", `/api/vehicles/${id}/baselines`, { body: baseline }), id);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ baseline });
      expect(vehicles.vehicles[0].baselines.find((b) => b.partId === "engine-oil")).toEqual(baseline);
    });

    it("VEH-07 answers 400 for a baseline above the current mileage", async () => {
      const { id } = await seedVehicle(owner);

      const response = await handlers.setBaseline(
        request("PUT", `/api/vehicles/${id}/baselines`, { body: { ...baseline, mileageKm: 46000 } }),
        id,
      );

      expect(response.status).toBe(400);
      expect(Object.keys((await response.json()).errors)).toEqual(["mileageKm"]);
    });

    it("VEH-13 answers 404 for another owner's vehicle", async () => {
      const { id } = await seedVehicle(otherOwner);

      const response = await handlers.setBaseline(request("PUT", `/api/vehicles/${id}/baselines`, { body: baseline }), id);

      expect(response.status).toBe(404);
    });

    it.each(["PUT", "POST"])("VEH-17 answers 403 to a technician sending %s and leaves the baselines alone", async (method) => {
      const { id } = await seedVehicle(owner);
      const before = structuredClone(vehicles.vehicles[0].baselines);

      const response = await handlers.setBaseline(request(method, `/api/vehicles/${id}/baselines`, { as: technician, body: baseline }), id);

      expect(response.status).toBe(403);
      expect(vehicles.vehicles[0].baselines).toEqual(before);
    });
  });
});
