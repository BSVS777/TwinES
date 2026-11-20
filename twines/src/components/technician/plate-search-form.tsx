"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/forms/form-field";
import styles from "@/components/forms/auth-form.module.css";

const GENERIC_ERROR = "Something went wrong. Please try again.";

/** The vehicle id from a successful search answer, or null when the body is not what was expected. */
function vehicleIdOf(body: unknown): string | null {
  const id = (body as { id?: unknown } | null)?.id;
  return typeof id === "string" ? id : null;
}

/** The message of a failed search: a 404 carries `error`, a 400 carries `errors` per field. */
function messageOf(body: unknown): string {
  const { error, errors } = (body ?? {}) as { error?: unknown; errors?: Record<string, unknown> };
  if (typeof error === "string") return error;
  const first = errors ? Object.values(errors)[0] : undefined;
  return typeof first === "string" ? first : GENERIC_ERROR;
}

/**
 * The technician's plate search (VEH-14, VEH-15). A hit opens the vehicle's health page; a miss
 * says so and stays here.
 */
export function PlateSearchForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const plate = String(new FormData(event.currentTarget).get("plate") ?? "");
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/technician/vehicles?plate=${encodeURIComponent(plate)}`);
      const body: unknown = await response.json().catch(() => null);
      const id = response.ok ? vehicleIdOf(body) : null;
      if (id !== null) {
        router.push(`/vehicles/${encodeURIComponent(id)}`);
        return;
      }
      setError(response.ok ? GENERIC_ERROR : messageOf(body));
    } catch {
      setError(GENERIC_ERROR);
    }
    setPending(false);
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}
      <FormField name="plate" label="Plate" type="text" autoComplete="off" hint="Letters, digits and hyphens, for example ABC-123." />
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
