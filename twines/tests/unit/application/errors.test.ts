import { describe, expect, it } from "vitest";
import {
  ApplicationError,
  Conflict,
  Forbidden,
  NotFound,
  TooManyAttempts,
  Unauthorized,
  ValidationError,
} from "@/application/errors";

describe("application errors", () => {
  it("carries the per-field messages of a validation failure", () => {
    const error = new ValidationError({ plate: "Plate is required" });

    expect(error.errors).toEqual({ plate: "Plate is required" });
    expect(error.name).toBe("ValidationError");
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toBeInstanceOf(Error);
  });

  it.each([
    ["Unauthorized", new Unauthorized(), "Authentication required"],
    ["Forbidden", new Forbidden(), "Forbidden"],
    ["NotFound", new NotFound(), "Not found"],
    ["TooManyAttempts", new TooManyAttempts(), "Too many attempts, try again later"],
  ])("%s has a default message and its own name", (name, error, message) => {
    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
    expect(error).toBeInstanceOf(ApplicationError);
  });

  it("lets callers override the default message", () => {
    expect(new Unauthorized("Invalid email or password").message).toBe("Invalid email or password");
    expect(new Forbidden("Technicians only").message).toBe("Technicians only");
    expect(new NotFound("Vehicle not found").message).toBe("Vehicle not found");
  });

  it("names the field of a conflict when known", () => {
    const withField = new Conflict("This plate is already registered", "plate");
    const withoutField = new Conflict("Already exists");

    expect(withField.field).toBe("plate");
    expect(withField.message).toBe("This plate is already registered");
    expect(withoutField.field).toBeUndefined();
  });

  it("exposes when a lockout ends", () => {
    const until = new Date("2026-11-19T12:00:00.000Z");

    expect(new TooManyAttempts(until).lockedUntil).toBe(until);
    expect(new TooManyAttempts().lockedUntil).toBeUndefined();
  });
});
