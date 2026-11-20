"use client";

import { FormField } from "@/components/forms/form-field";
import { useJsonForm, type FormFields } from "@/components/forms/use-json-form";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import styles from "./auth-form.module.css";

interface BaselineFormProps {
  vehicleId: string;
}

const PART_OPTIONS = MAINTENANCE_CATALOG.map((part) => ({ value: part.id, label: part.name }));

/** Blank stays unset so the server asks for it; text that is not a number is sent as typed. */
function toBody(fields: FormFields) {
  const mileage = fields.mileageKm.trim();
  return {
    partId: fields.partId,
    mileageKm: mileage === "" ? undefined : Number.isNaN(Number(mileage)) ? mileage : Number(mileage),
    date: fields.date,
  };
}

/** Sets when and at what mileage one part was last serviced (VEH-06, VEH-07). */
export function BaselineForm({ vehicleId }: BaselineFormProps) {
  const { errors, pending, saved, onSubmit } = useJsonForm(`/api/vehicles/${vehicleId}/baselines`, null, {
    method: "PUT",
    toBody,
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errors.form && (
        <p role="alert" className={styles.formError}>
          {errors.form}
        </p>
      )}
      <FormField
        name="partId"
        label="Part"
        type="select"
        options={PART_OPTIONS}
        placeholder="Select a part"
        error={errors.partId}
      />
      <FormField
        name="mileageKm"
        label="Mileage at last service (km)"
        type="text"
        inputMode="numeric"
        error={errors.mileageKm}
      />
      <FormField name="date" label="Date of last service" type="date" error={errors.date} />
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Saving..." : "Save baseline"}
      </button>
      {saved && (
        <p role="status" className={styles.saved}>
          Baseline saved
        </p>
      )}
    </form>
  );
}
