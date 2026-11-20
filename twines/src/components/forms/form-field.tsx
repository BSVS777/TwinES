"use client";

import { useId } from "react";
import styles from "./auth-form.module.css";

export interface FieldOption {
  value: string;
  label: string;
}

interface FormFieldProps {
  name: string;
  label: string;
  type: "email" | "password" | "text" | "date" | "select";
  autoComplete?: string;
  /** Always-visible guidance, announced with the field. */
  hint?: string;
  error?: string;
  /** Initial value, for forms that edit something that already exists. */
  defaultValue?: string;
  /** Brings up the numeric keyboard while the text stays free-form, so the server judges it. */
  inputMode?: "numeric";
  /** The choices of a `select`; its first, empty choice reads `placeholder`. */
  options?: readonly FieldOption[];
  placeholder?: string;
}

/** A labelled input or select whose hint and error message are announced together with it. */
export function FormField({
  name,
  label,
  type,
  autoComplete,
  hint,
  error,
  defaultValue,
  inputMode,
  options = [],
  placeholder = "Select an option",
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  const control = {
    id,
    name,
    defaultValue,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  } as const;

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {type === "select" ? (
        <select {...control}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...control} type={type} autoComplete={autoComplete} inputMode={inputMode} />
      )}
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
