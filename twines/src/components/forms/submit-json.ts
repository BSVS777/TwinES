export type FieldErrors = Record<string, string>;

export type SubmitResult = { ok: true } | { ok: false; errors: FieldErrors };

const GENERIC_ERROR = "Something went wrong. Please try again.";

function isFieldErrors(value: unknown): value is FieldErrors {
  return typeof value === "object" && value !== null && Object.values(value).every((v) => typeof v === "string");
}

/** Reads the error body of a failed response into per-field messages; `form` holds the general one. */
async function errorsOf(response: Response): Promise<FieldErrors> {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null) return { form: GENERIC_ERROR };
  const { errors, error } = body as { errors?: unknown; error?: unknown };
  if (isFieldErrors(errors)) return errors;
  return { form: typeof error === "string" ? error : GENERIC_ERROR };
}

export type JsonMethod = "POST" | "PUT" | "PATCH";

/** Sends a JSON body to an API endpoint (POST unless told otherwise) and turns the answer into a success or field errors. */
export async function submitJson(path: string, body: unknown, method: JsonMethod = "POST"): Promise<SubmitResult> {
  try {
    const response = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok ? { ok: true } : { ok: false, errors: await errorsOf(response) };
  } catch {
    return { ok: false, errors: { form: GENERIC_ERROR } };
  }
}
