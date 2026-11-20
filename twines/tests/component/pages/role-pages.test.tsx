import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicUser } from "@/application/ports";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  forbidden: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;403");
  }),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT;${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  forbidden: mocks.forbidden,
  redirect: mocks.redirect,
  notFound: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/infrastructure/auth/current-user", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/infrastructure/container", () => ({ getContainer: vi.fn() }));

const owner: PublicUser = { id: "o1", email: "owner@twines.test", role: "owner" };
const technician: PublicUser = { id: "t1", email: "tech@twines.test", role: "technician" };

beforeEach(() => {
  mocks.forbidden.mockClear();
  mocks.redirect.mockClear();
});

afterEach(() => {
  mocks.requireUser.mockReset();
});

describe("technician-only page", () => {
  it("AUTH-15 forbids an owner with a real 403", async () => {
    mocks.requireUser.mockResolvedValue(owner);
    const { default: TechnicianPage } = await import("@/app/technician/page");

    await expect(TechnicianPage()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;403");
    expect(mocks.forbidden).toHaveBeenCalledOnce();
  });

  it("lets a technician in", async () => {
    mocks.requireUser.mockResolvedValue(technician);
    const { default: TechnicianPage } = await import("@/app/technician/page");

    expect(await TechnicianPage()).toBeTruthy();
    expect(mocks.forbidden).not.toHaveBeenCalled();
  });
});

describe("owner-only pages", () => {
  it("VEH-17 forbids a technician on the register page with a real 403", async () => {
    mocks.requireUser.mockResolvedValue(technician);
    const { default: NewVehiclePage } = await import("@/app/vehicles/new/page");

    await expect(NewVehiclePage()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;403");
    expect(mocks.forbidden).toHaveBeenCalledOnce();
  });

  it("lets an owner reach the register page", async () => {
    mocks.requireUser.mockResolvedValue(owner);
    const { default: NewVehiclePage } = await import("@/app/vehicles/new/page");

    expect(await NewVehiclePage()).toBeTruthy();
    expect(mocks.forbidden).not.toHaveBeenCalled();
  });

  it("VEH-17 forbids a technician on the edit page with a real 403", async () => {
    mocks.requireUser.mockResolvedValue(technician);
    const { default: EditVehiclePage } = await import("@/app/vehicles/[id]/edit/page");

    await expect(EditVehiclePage({ params: Promise.resolve({ id: "v1" }) })).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;403",
    );
    expect(mocks.forbidden).toHaveBeenCalledOnce();
  });

  it("keeps sending technicians from the vehicle list to their own start page", async () => {
    mocks.requireUser.mockResolvedValue(technician);
    const { default: VehiclesPage } = await import("@/app/vehicles/page");

    await expect(VehiclesPage()).rejects.toThrow("NEXT_REDIRECT;/technician");
    expect(mocks.forbidden).not.toHaveBeenCalled();
  });
});
