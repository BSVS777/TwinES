"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { submitJson, type FieldErrors, type JsonMethod } from "@/components/forms/submit-json";

export type FormFields = Record<string, string>;

export interface JsonFormOptions {
  /** HTTP method of the request; POST by default. */
  method?: JsonMethod;
  /** Shapes the typed-in text into the request body; by default the fields are sent as they are. */
  toBody?: (fields: FormFields) => unknown;
}

/**
 * State for a form that sends its fields as JSON. On success it navigates to `successPath` and
 * refreshes so server components see the change; with a `null` path it stays on the page, only
 * refreshes, and reports `saved`. On failure it exposes the messages.
 */
export function useJsonForm(endpoint: string, successPath: string | null, options: JsonFormOptions = {}) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setErrors({});

    const fields = Object.fromEntries(new FormData(event.currentTarget)) as FormFields;
    const body = options.toBody ? options.toBody(fields) : fields;
    const result = await submitJson(endpoint, body, options.method);
    if (result.ok) {
      if (successPath === null) {
        setSaved(true);
        setPending(false);
      } else {
        router.push(successPath);
      }
      router.refresh();
      return;
    }
    setErrors(result.errors);
    setPending(false);
  }

  return { errors, pending, saved, onSubmit };
}
