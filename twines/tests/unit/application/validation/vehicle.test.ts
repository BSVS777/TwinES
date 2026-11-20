import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { ValidationError } from "@/application/errors";
import { parseInput } from "@/application/validation/parse";
import { baselineSchema, plateSearchSchema, vehicleSchema, vehicleUpdateSchema } from "@/application/validation/vehicle";
import { parseCalendarDate } from "@/domain/shared/calendar-date";

const TODAY = parseCalendarDate("2026-03-10");

const VALID = {
  plate: "abc-123",
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  bodyType: "sedan",
  currentMileageKm: 45000,
  purchaseDate: "2020-03-01",
};

/** The error messages by field for an input, or null when it is valid. */
function errorsFor(schema: ZodType, input: unknown): Record<string, string> | null {
  try {
    parseInput(schema, input);
    return null;
  } catch (error) {
    if (error instanceof ValidationError) return error.errors;
    throw error;
  }
}

const register = vehicleSchema(TODAY);
const update = vehicleUpdateSchema(TODAY);
const baseline = baselineSchema(TODAY);

function registerErrors(overrides: Record<string, unknown>) {
  return errorsFor(register, { ...VALID, ...overrides });
}

describe("vehicleSchema", () => {
  it("VEH-01 accepts the example registration and normalizes the plate", () => {
    expect(parseInput(register, VALID)).toEqual({
      plate: "ABC-123",
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      bodyType: "sedan",
      currentMileageKm: 45000,
      purchaseDate: "2020-03-01",
      monthlyMileageKm: 1000,
    });
  });

  it("drops unknown keys such as ownerId so they can never reach a use case", () => {
    const parsed = parseInput(register, { ...VALID, ownerId: "someone-else", id: "x" });

    expect(parsed).not.toHaveProperty("ownerId");
    expect(parsed).not.toHaveProperty("id");
  });

  it("reports a body that is not an object under the form key", () => {
    expect(errorsFor(register, undefined)).toEqual({ form: "Invalid input" });
    expect(errorsFor(register, "text")).toEqual({ form: "Invalid input" });
  });

  it("VEH-03 gives each invalid field its own message in one pass", () => {
    const errors = registerErrors({
      year: 1989,
      currentMileageKm: -1,
      purchaseDate: "2026-03-11",
      bodyType: "truck",
      plate: "ABCDEFGHI",
    });

    expect(errors).toEqual({
      plate: "Plate must be at most 8 characters",
      year: "Year must be 1990 or later",
      bodyType: "Body type must be sedan, hatchback, suv or pickup",
      currentMileageKm: "Mileage cannot be negative",
      purchaseDate: "Purchase date cannot be in the future",
    });
  });

  describe("plate", () => {
    it.each([
      ["  abc-123 ", "ABC-123"],
      ["a", "A"],
      ["ab12-cd9", "AB12-CD9"],
      ["-", "-"],
    ])("VEH-03 accepts %j as %j (1 to 8 letters, digits or hyphens)", (plate, stored) => {
      expect(parseInput(register, { ...VALID, plate }).plate).toBe(stored);
    });

    it("VEH-03 rejects 9 characters but accepts 8", () => {
      expect(registerErrors({ plate: "ABCDEFGH" })).toBeNull();
      expect(registerErrors({ plate: "ABCDEFGHI" })).toEqual({ plate: "Plate must be at most 8 characters" });
    });

    it("counts the plate after trimming", () => {
      expect(registerErrors({ plate: "  ABCDEFGH  " })).toBeNull();
    });

    it.each(["", "   ", undefined])("VEH-03 requires a plate (%j)", (plate) => {
      expect(registerErrors({ plate })).toEqual({ plate: "Plate is required" });
    });

    it.each(["AB C", "AB_1", "AB#1", "ÁB1", "AB.1"])(
      "VEH-03 rejects %j: only letters, digits and hyphens",
      (plate) => {
        expect(registerErrors({ plate })).toEqual({ plate: "Plate can only have letters, digits and hyphens" });
      },
    );

    it("rejects a plate that is not text", () => {
      expect(registerErrors({ plate: 123 })).toEqual({ plate: "Plate is required" });
    });
  });

  describe.each([
    ["make", "Make"],
    ["model", "Model"],
  ])("%s", (field, label) => {
    it("accepts 1 and 50 characters, trimmed", () => {
      expect(registerErrors({ [field]: "A" })).toBeNull();
      expect(registerErrors({ [field]: "A".repeat(50) })).toBeNull();
      expect(parseInput(register, { ...VALID, [field]: "  Corolla  " })[field as "make"]).toBe("Corolla");
    });

    it("rejects 51 characters", () => {
      expect(registerErrors({ [field]: "A".repeat(51) })).toEqual({
        [field]: `${label} must be at most 50 characters`,
      });
    });

    it.each(["", "   ", undefined])("is required (%j)", (value) => {
      expect(registerErrors({ [field]: value })).toEqual({ [field]: `${label} is required` });
    });
  });

  describe("year", () => {
    it("VEH-03 accepts 1990 and next year, rejects 1989 and the year after next", () => {
      expect(registerErrors({ year: 1990 })).toBeNull();
      expect(registerErrors({ year: 2027 })).toBeNull();
      expect(registerErrors({ year: 1989 })).toEqual({ year: "Year must be 1990 or later" });
      expect(registerErrors({ year: 2028 })).toEqual({ year: "Year must be 2027 or earlier" });
    });

    it("takes the upper bound from the date it was built with", () => {
      const later = vehicleSchema(parseCalendarDate("2030-01-01"));

      expect(errorsFor(later, { ...VALID, year: 2031 })).toBeNull();
      expect(errorsFor(later, { ...VALID, year: 2032 })).toEqual({ year: "Year must be 2031 or earlier" });
    });

    it.each([2020.5, "2020", null, Number.NaN])("rejects %j as not a whole number", (year) => {
      expect(registerErrors({ year })).toEqual({ year: "Year must be a whole number" });
    });

    it("is required", () => {
      expect(registerErrors({ year: undefined })).toEqual({ year: "Year is required" });
    });
  });

  describe("bodyType", () => {
    it.each(["sedan", "hatchback", "suv", "pickup"])("accepts %s", (bodyType) => {
      expect(registerErrors({ bodyType })).toBeNull();
    });

    it.each(["truck", "SEDAN", "", 4])("VEH-03 rejects %j", (bodyType) => {
      expect(registerErrors({ bodyType })).toEqual({ bodyType: "Body type must be sedan, hatchback, suv or pickup" });
    });

    it("is required", () => {
      expect(registerErrors({ bodyType: undefined })).toEqual({ bodyType: "Body type is required" });
    });
  });

  describe("currentMileageKm", () => {
    it("VEH-03 accepts 0 and 1,000,000, rejects -1 and 1,000,001", () => {
      expect(registerErrors({ currentMileageKm: 0 })).toBeNull();
      expect(registerErrors({ currentMileageKm: 1_000_000 })).toBeNull();
      expect(registerErrors({ currentMileageKm: -1 })).toEqual({ currentMileageKm: "Mileage cannot be negative" });
      expect(registerErrors({ currentMileageKm: 1_000_001 })).toEqual({
        currentMileageKm: "Mileage cannot be more than 1,000,000 km",
      });
    });

    it("rejects fractions and text, and is required", () => {
      expect(registerErrors({ currentMileageKm: 10.5 })).toEqual({
        currentMileageKm: "Mileage must be a whole number",
      });
      expect(registerErrors({ currentMileageKm: "100" })).toEqual({
        currentMileageKm: "Mileage must be a whole number",
      });
      expect(registerErrors({ currentMileageKm: undefined })).toEqual({ currentMileageKm: "Mileage is required" });
    });
  });

  describe("purchaseDate", () => {
    it("VEH-03 accepts today and any past day, rejects tomorrow", () => {
      expect(registerErrors({ purchaseDate: "2026-03-10" })).toBeNull();
      expect(registerErrors({ purchaseDate: "1980-01-01" })).toBeNull();
      expect(registerErrors({ purchaseDate: "2026-03-11" })).toEqual({
        purchaseDate: "Purchase date cannot be in the future",
      });
    });

    it.each(["2026-02-30", "2026-3-1", "10/03/2026", "yesterday", "", 20200301])(
      "rejects %j as not a real YYYY-MM-DD date",
      (purchaseDate) => {
        expect(registerErrors({ purchaseDate })).toEqual({
          purchaseDate: "Purchase date must be a real date written as YYYY-MM-DD",
        });
      },
    );

    it("is required", () => {
      expect(registerErrors({ purchaseDate: undefined })).toEqual({ purchaseDate: "Purchase date is required" });
    });
  });

  describe("monthlyMileageKm", () => {
    it("VEH-04 defaults to 1000 when omitted", () => {
      expect(parseInput(register, VALID).monthlyMileageKm).toBe(1000);
    });

    it("keeps an explicit value, including 0", () => {
      expect(parseInput(register, { ...VALID, monthlyMileageKm: 0 }).monthlyMileageKm).toBe(0);
      expect(parseInput(register, { ...VALID, monthlyMileageKm: 2500 }).monthlyMileageKm).toBe(2500);
    });

    it("accepts 0 and 10,000, rejects -1 and 10,001", () => {
      expect(registerErrors({ monthlyMileageKm: 10_000 })).toBeNull();
      expect(registerErrors({ monthlyMileageKm: -1 })).toEqual({
        monthlyMileageKm: "Monthly mileage cannot be negative",
      });
      expect(registerErrors({ monthlyMileageKm: 10_001 })).toEqual({
        monthlyMileageKm: "Monthly mileage cannot be more than 10,000 km",
      });
    });

    it("rejects fractions and text instead of defaulting", () => {
      expect(registerErrors({ monthlyMileageKm: 1.5 })).toEqual({
        monthlyMileageKm: "Monthly mileage must be a whole number",
      });
      expect(registerErrors({ monthlyMileageKm: "1000" })).toEqual({
        monthlyMileageKm: "Monthly mileage must be a whole number",
      });
    });
  });
});

describe("vehicleUpdateSchema", () => {
  it("accepts the full registration shape with the same normalization", () => {
    expect(parseInput(update, { ...VALID, monthlyMileageKm: 1200 })).toMatchObject({
      plate: "ABC-123",
      monthlyMileageKm: 1200,
    });
  });

  it("accepts a partial change and does not invent values for omitted fields", () => {
    expect(parseInput(update, { currentMileageKm: 46000 })).toEqual({ currentMileageKm: 46000 });
    expect(parseInput(update, {})).toEqual({});
  });

  it("does not reset the monthly mileage to the registration default when it is omitted", () => {
    expect(parseInput(update, { make: "Honda" })).not.toHaveProperty("monthlyMileageKm");
  });

  it("applies the registration rules to every field it receives", () => {
    expect(errorsFor(update, { year: 1989, currentMileageKm: 1_000_001, purchaseDate: "2026-03-11" })).toEqual({
      year: "Year must be 1990 or later",
      currentMileageKm: "Mileage cannot be more than 1,000,000 km",
      purchaseDate: "Purchase date cannot be in the future",
    });
    expect(errorsFor(update, { plate: "" })).toEqual({ plate: "Plate is required" });
    expect(errorsFor(update, { monthlyMileageKm: 10_001 })).toEqual({
      monthlyMileageKm: "Monthly mileage cannot be more than 10,000 km",
    });
  });

  it("drops ownerId", () => {
    expect(parseInput(update, { ownerId: "someone-else", make: "Honda" })).toEqual({ make: "Honda" });
  });

  it("reports a body that is not an object", () => {
    expect(errorsFor(update, null)).toEqual({ form: "Invalid input" });
  });
});

describe("baselineSchema", () => {
  const VALID_BASELINE = { partId: "engine-oil", mileageKm: 42000, date: "2026-02-01" };

  function baselineErrors(overrides: Record<string, unknown>) {
    return errorsFor(baseline, { ...VALID_BASELINE, ...overrides });
  }

  it("VEH-06 accepts a part, a mileage and a date", () => {
    expect(parseInput(baseline, VALID_BASELINE)).toEqual(VALID_BASELINE);
  });

  it.each(["engine-oil", "oil-filter", "air-filter", "brake-pads", "tires", "battery", "coolant", "spark-plugs"])(
    "accepts the catalog part %s",
    (partId) => {
      expect(baselineErrors({ partId })).toBeNull();
    },
  );

  it("rejects a part outside the catalog and a missing part", () => {
    expect(baselineErrors({ partId: "wipers" })).toEqual({ partId: "Part must be one of the 8 tracked parts" });
    expect(baselineErrors({ partId: undefined })).toEqual({ partId: "Part is required" });
  });

  it("VEH-07 accepts mileage 0, rejects negatives, fractions and text", () => {
    expect(baselineErrors({ mileageKm: 0 })).toBeNull();
    expect(baselineErrors({ mileageKm: -1 })).toEqual({ mileageKm: "Mileage cannot be negative" });
    expect(baselineErrors({ mileageKm: 1.5 })).toEqual({ mileageKm: "Mileage must be a whole number" });
    expect(baselineErrors({ mileageKm: "5" })).toEqual({ mileageKm: "Mileage must be a whole number" });
    expect(baselineErrors({ mileageKm: undefined })).toEqual({ mileageKm: "Mileage is required" });
  });

  it("caps the mileage at the odometer maximum", () => {
    expect(baselineErrors({ mileageKm: 1_000_000 })).toBeNull();
    expect(baselineErrors({ mileageKm: 1_000_001 })).toEqual({ mileageKm: "Mileage cannot be more than 1,000,000 km" });
  });

  it("VEH-07 accepts today, rejects a future date and an impossible one", () => {
    expect(baselineErrors({ date: "2026-03-10" })).toBeNull();
    expect(baselineErrors({ date: "2026-03-11" })).toEqual({ date: "Date cannot be in the future" });
    expect(baselineErrors({ date: "2026-02-30" })).toEqual({
      date: "Date must be a real date written as YYYY-MM-DD",
    });
    expect(baselineErrors({ date: undefined })).toEqual({ date: "Date is required" });
  });

  it("drops unknown keys such as vehicleId", () => {
    expect(parseInput(baseline, { ...VALID_BASELINE, vehicleId: "other" })).not.toHaveProperty("vehicleId");
  });
});

describe("plateSearchSchema", () => {
  const search = plateSearchSchema();

  it.each([
    ["abc-123", "ABC-123"],
    ["  abc-123  ", "ABC-123"],
    ["a", "A"],
    ["abcdefgh", "ABCDEFGH"],
    ["  ABCDEFGH  ", "ABCDEFGH"],
  ])("VEH-14 normalizes %j to %j", (typed, normalized) => {
    expect(parseInput(search, typed)).toBe(normalized);
  });

  it("VEH-03 applies the registration length limit after normalization", () => {
    expect(errorsFor(search, "ABCDEFGHI")).toEqual({ form: "Plate must be at most 8 characters" });
    expect(errorsFor(search, "  abcdefghi  ")).toEqual({ form: "Plate must be at most 8 characters" });
    expect(errorsFor(search, "x".repeat(5000))).toEqual({ form: "Plate must be at most 8 characters" });
  });

  it.each(["AB C", "AB_1", "AB.1", "ABC%", "A*B", "ABC;--", "<b>", "ÁBC-1"])(
    "VEH-03 applies the registration character rule to %j",
    (typed) => {
      expect(errorsFor(search, typed)).toEqual({ form: "Plate can only have letters, digits and hyphens" });
    },
  );

  it.each(["", "   ", undefined, null, 123])("still asks for a plate when the input is %j", (typed) => {
    expect(errorsFor(search, typed)).toEqual({ form: "Plate is required" });
  });

  it("accepts exactly what registration accepts, so a registered plate is always searchable", () => {
    for (const plate of ["a", "ABC-123", "1-2-3-4-", "abcdefgh"]) {
      expect(errorsFor(register, { ...VALID, plate })).toBeNull();
      expect(errorsFor(search, plate)).toBeNull();
    }
  });
});
