"use client";

import { useId, useState, type FormEvent } from "react";
import type { PartId } from "@/domain/part-health/catalog";
import type { RecordServiceAction } from "./use-service-recorder";
import styles from "./PartDetailPanel.module.css";

interface MarkServicedActionProps {
  partId: PartId;
  /** The vehicle's mileage, offered as the starting value of the optional reading. */
  currentMileageKm?: number;
  /** Sends the service; resolves to an error message, or null when it was saved. */
  onMarkServiced?: RecordServiceAction;
}

/**
 * A technician's way to record a serviced part (VIEW-08, VEH-16). The button opens a small form
 * with the optional current mileage; the server has the last word on whether it is acceptable.
 */
export function MarkServicedAction({ partId, currentMileageKm, onMarkServiced }: MarkServicedActionProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    // The reading is taken before the field is disabled for the request.
    const typed = String(new FormData(event.currentTarget).get("currentMileageKm") ?? "").trim();
    setPending(true);
    setError(null);

    const message = (await onMarkServiced?.(partId, typed === "" ? undefined : Number(typed))) ?? null;
    setPending(false);
    if (message === null) {
      setOpen(false);
      setRecorded(true);
    } else {
      setError(message);
    }
  }

  if (!open) {
    return (
      <>
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            setRecorded(false);
            setOpen(true);
          }}
        >
          Mark as serviced
        </button>
        {recorded && (
          <p role="status" className={styles.recorded}>
            Service recorded
          </p>
        )}
      </>
    );
  }

  return (
    <form className={styles.service} onSubmit={onSubmit} noValidate>
      <div className={styles.serviceField}>
        <label htmlFor={inputId}>Current mileage (km)</label>
        <input
          id={inputId}
          name="currentMileageKm"
          type="number"
          inputMode="numeric"
          defaultValue={currentMileageKm}
          disabled={pending}
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error && (
        <p role="alert" className={styles.serviceError}>
          {error}
        </p>
      )}
      <div className={styles.serviceButtons}>
        <button type="submit" className={styles.action} disabled={pending}>
          {pending ? "Saving..." : "Confirm service"}
        </button>
        <button type="button" className={styles.secondary} disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
