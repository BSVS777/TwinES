import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Conflict,
  Forbidden,
  NotFound,
  TooManyAttempts,
  Unauthorized,
  ValidationError,
} from "@/application/errors";
import { errorResponse, handle } from "@/infrastructure/http/handle";

afterEach(() => {
  vi.restoreAllMocks();
});

async function describeResponse(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("errorResponse", () => {
  it("maps ValidationError to 400 with the per-field errors", async () => {
    const error = new ValidationError({ email: "Enter a valid email address", password: "Password is required" });

    expect(await describeResponse(errorResponse(error))).toEqual({
      status: 400,
      body: { errors: { email: "Enter a valid email address", password: "Password is required" } },
    });
  });

  it("maps Unauthorized to 401 with its own message", async () => {
    expect(await describeResponse(errorResponse(new Unauthorized("Invalid email or password")))).toEqual({
      status: 401,
      body: { error: "Invalid email or password" },
    });
    expect(await describeResponse(errorResponse(new Unauthorized()))).toEqual({
      status: 401,
      body: { error: "Authentication required" },
    });
  });

  it("maps Forbidden to 403", async () => {
    expect(await describeResponse(errorResponse(new Forbidden()))).toEqual({
      status: 403,
      body: { error: "Forbidden" },
    });
  });

  it("maps NotFound to 404", async () => {
    expect(await describeResponse(errorResponse(new NotFound()))).toEqual({
      status: 404,
      body: { error: "Not found" },
    });
  });

  it("maps Conflict to 409 keyed by the colliding field", async () => {
    expect(
      await describeResponse(errorResponse(new Conflict("An account with this email already exists", "email"))),
    ).toEqual({
      status: 409,
      body: { errors: { email: "An account with this email already exists" } },
    });
  });

  it("keys a Conflict without a field under form", async () => {
    expect(await describeResponse(errorResponse(new Conflict("Already taken")))).toEqual({
      status: 409,
      body: { errors: { form: "Already taken" } },
    });
  });

  it("maps TooManyAttempts to 429", async () => {
    expect(await describeResponse(errorResponse(new TooManyAttempts(new Date("2026-03-10T12:15:00Z"))))).toEqual({
      status: 429,
      body: { error: "Too many attempts, try again later" },
    });
  });

  it("maps unknown failures to a generic 500 that leaks nothing and logs the cause", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const secret = new Error("SQLITE_ERROR: no such table: User at C:\\app\\dev.db");

    const result = await describeResponse(errorResponse(secret));

    expect(result).toEqual({ status: 500, body: { error: "Internal server error" } });
    expect(JSON.stringify(result)).not.toContain("SQLITE");
    expect(log).toHaveBeenCalledWith(secret);
  });

  it("treats a thrown non-Error value as an unknown failure too", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await describeResponse(errorResponse("boom"))).toEqual({
      status: 500,
      body: { error: "Internal server error" },
    });
  });
});

describe("handle", () => {
  it("returns the response of the action when it succeeds", async () => {
    const response = await handle(async () => Response.json({ ok: true }, { status: 201 }));

    expect(await describeResponse(response)).toEqual({ status: 201, body: { ok: true } });
  });

  it("turns an error thrown by the action into its mapped response", async () => {
    const response = await handle(async () => {
      throw new Forbidden("Cross-origin request refused");
    });

    expect(await describeResponse(response)).toEqual({
      status: 403,
      body: { error: "Cross-origin request refused" },
    });
  });

  it("turns a synchronous throw into a response as well", async () => {
    const response = await handle(() => {
      throw new NotFound();
    });

    expect(response.status).toBe(404);
  });
});
