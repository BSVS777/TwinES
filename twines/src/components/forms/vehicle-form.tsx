"use client";

import { FormField, type FieldOption } from "@/components/forms/form-field";
import { useJsonForm, type FormFields } from "@/components/forms/use-json-form";
import styles from "./auth-form.module.css";

/** A vehicle's editable details as the form shows them (the edit page passes these in). */
export interface VehicleFormValues {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
  currentMileageKm: number;
  purchaseDate: string;
  monthlyMileageKm: number;
}

interface VehicleFormProps {
  /** Present when editing; without it the form registers a new vehicle. */
  vehicle?: VehicleFormValues;
}

const BODY_TYPES: readonly FieldOption[] = [
  { value: "sedan", label: "Sedan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup" },
];

/**
 * A number typed into a text box. Blank means "not provided" so the server reports it as
 * required; text that is not a number is sent as typed so the server rejects it with its own
 * message instead of the browser guessing.
 */
function numberField(text: string): number | string | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isNaN(value) ? trimmed : value;
}

function toBody(fields: FormFields) {
  return {
    plate: fields.plate,
    make: fields.make,
    model: fields.model,
    year: numberField(fields.year),
    bodyType: fields.bodyType,
    currentMileageKm: numberField(fields.currentMileageKm),
    purchaseDate: fields.purchaseDate,
    monthlyMileageKm: numberField(fields.monthlyMileageKm),
  };
}

/** Registers a vehicle (VEH-01 to VEH-04), or edits one when `vehicle` is given (VEH-09). */
export function VehicleForm({ vehicle }: VehicleFormProps) {
  const editing = vehicle !== undefined;
  const { errors, pending, onSubmit } = useJsonForm(
    editing ? `/api/vehicles/${vehicle.id}` : "/api/vehicles",
    "/vehicles",
    { method: editing ? "PATCH" : "POST", toBody },
  );

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errors.form && (
        <p role="alert" className={styles.formError}>
          {errors.form}
        </p>
      )}
      <FormField name="plate" label="Plate" type="text" defaultValue={vehicle?.plate} error={errors.plate} />
      <FormField name="make" label="Make" type="text" defaultValue={vehicle?.make} error={errors.make} />
      <FormField name="model" label="Model" type="text" defaultValue={vehicle?.model} error={errors.model} />
      <FormField
        name="year"
        label="Year"
        type="text"
        inputMode="numeric"
        defaultValue={vehicle?.year.toString()}
        error={errors.year}
      />
      <FormField
        name="bodyType"
        label="Body type"
        type="select"
        options={BODY_TYPES}
        placeholder="Select body type"
        defaultValue={vehicle?.bodyType}
        error={errors.bodyType}
      />
      <FormField
        name="currentMileageKm"
        label="Current mileage (km)"
        type="text"
        inputMode="numeric"
        defaultValue={vehicle?.currentMileageKm.toString()}
        error={errors.currentMileageKm}
      />
      <FormField
        name="purchaseDate"
        label="Purchase date"
        type="date"
        defaultValue={vehicle?.purchaseDate}
        error={errors.purchaseDate}
      />
      <FormField
        name="monthlyMileageKm"
        label="Estimated monthly mileage (km)"
        type="text"
        inputMode="numeric"
        hint="Defaults to 1,000 km"
        defaultValue={vehicle?.monthlyMileageKm.toString()}
        error={errors.monthlyMileageKm}
      />
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Saving..." : editing ? "Save changes" : "Register vehicle"}
      </button>
    </form>
  );
}
