import type { ZodType } from "zod";
import { ValidationError } from "@/application/errors";

/** Key used for problems that belong to the whole input rather than one field. */
const FORM_KEY = "form";

/**
 * Validates untrusted input and returns the parsed value. On failure it throws a
 * `ValidationError` with the first message per field, so every form can show one message each.
 */
export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : FORM_KEY;
    errors[field] ??= issue.message;
  }
  throw new ValidationError(errors);
}
