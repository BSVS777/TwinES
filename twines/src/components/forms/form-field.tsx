"use client";

import { useId } from "react";
import styles from "./auth-form.module.css";

interface FormFieldProps {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  /** Always-visible guidance, announced with the field. */
  hint?: string;
  error?: string;
}

/** A labelled input whose hint and error message are announced together with it. */
export function FormField({ name, label, type, autoComplete, hint, error }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
