"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { submitJson, type FieldErrors } from "@/components/forms/submit-json";

/**
 * State for a form that posts its fields as JSON. On success it navigates to `successPath` and
 * refreshes so server components see the new session; on failure it exposes the messages.
 */
export function useJsonForm(endpoint: string, successPath: string) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});

    const result = await submitJson(endpoint, Object.fromEntries(new FormData(event.currentTarget)));
    if (result.ok) {
      router.push(successPath);
      router.refresh();
      return;
    }
    setErrors(result.errors);
    setPending(false);
  }

  return { errors, pending, onSubmit };
}
