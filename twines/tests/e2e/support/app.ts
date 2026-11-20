import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";
import { randomPassword, uniqueEmail, uniquePlate, type Account } from "./accounts";

/** Where the app under test is served; the same value the Origin check compares against. */
export const ORIGIN = `http://localhost:${Number(process.env.E2E_PORT ?? 3200)}`;

const TIME_ZONE = "America/Costa_Rica";
const DAY_MS = 24 * 60 * 60 * 1000;

/** The calendar day (YYYY-MM-DD) the app considers today, shifted by `offsetDays`. */
export function appDate(offsetDays = 0): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(Date.now() + offsetDays * DAY_MS),
  );
}

/**
 * An API call. Mutating calls must carry an Origin header equal to the app's origin, or they are
 * refused (403, by design), so it is sent unless a test passes another `origin` (or `null` for none).
 */
export function send(
  request: APIRequestContext,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  { data, origin = ORIGIN }: { data?: unknown; origin?: string | null } = {},
): Promise<APIResponse> {
  const headers: Record<string, string> = method !== "GET" && origin !== null ? { Origin: origin } : {};
  return request.fetch(url, { method, data, headers });
}

export function post(request: APIRequestContext, url: string, data: unknown): Promise<APIResponse> {
  return send(request, "POST", url, { data });
}

/** Signs up a throwaway owner through the API; the request context keeps the session cookie. */
export async function signUpOwner(request: APIRequestContext): Promise<Account> {
  const account = { email: uniqueEmail(), password: randomPassword() };
  const response = await post(request, "/api/auth/sign-up", account);
  expect(response.status(), "sign-up").toBe(201);
  return account;
}

/** Signs in through the API; the request context keeps the session cookie. */
export async function signInApi(request: APIRequestContext, account: Account): Promise<void> {
  const response = await post(request, "/api/auth/sign-in", account);
  expect(response.status(), `sign-in as ${account.email}`).toBe(200);
}

export interface VehicleInput {
  plate: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
  currentMileageKm: number;
  purchaseDate: string;
  monthlyMileageKm?: number;
}

/** A valid vehicle; its plate is unique, so tests never collide with each other. */
export function newVehicle(overrides: Partial<VehicleInput> = {}): VehicleInput {
  return {
    plate: uniquePlate(),
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    bodyType: "sedan",
    currentMileageKm: 45_000,
    purchaseDate: "2020-03-01",
    ...overrides,
  };
}

/** Registers a vehicle for the signed-in owner of `request` and returns what the API answers. */
export async function registerVehicle(request: APIRequestContext, overrides: Partial<VehicleInput> = {}) {
  const input = newVehicle(overrides);
  const response = await post(request, "/api/vehicles", input);
  expect(response.status(), "vehicle registration").toBe(201);
  const { vehicle } = (await response.json()) as { vehicle: VehicleInput & { id: string } };
  return vehicle;
}

/**
 * Opens a page and waits until the client has hydrated. Forms are plain React handlers: a click
 * before hydration would submit the form natively and reload the page instead.
 */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** Signs in through the sign-in form and waits for the landing page. */
export async function signInUi(page: Page, account: Account, landing: string | RegExp = /\/vehicles$/): Promise<void> {
  await open(page, "/sign-in");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(landing);
}

/** The id of the owner's own vehicle with `plate` (read from the owner's list). */
export async function ownVehicleId(request: APIRequestContext, plate: string): Promise<string> {
  const response = await send(request, "GET", "/api/vehicles");
  expect(response.status(), "vehicle list").toBe(200);
  const { vehicles } = (await response.json()) as { vehicles: { id: string; plate: string }[] };
  const found = vehicles.find((vehicle) => vehicle.plate === plate);
  if (!found) throw new Error(`No vehicle ${plate} in the owner's list`);
  return found.id;
}

/** Opens the health page of the owner's vehicle with `plate` and waits for hydration. */
export async function openOwnVehicle(page: Page, plate: string): Promise<string> {
  const id = await ownVehicleId(page.context().request, plate);
  await open(page, `/vehicles/${id}`);
  return id;
}
