import {
  ApplicationError,
  Conflict,
  Forbidden,
  NotFound,
  TooManyAttempts,
  Unauthorized,
  ValidationError,
} from "@/application/errors";

function message(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/**
 * Maps a failure to its HTTP response. Application errors carry their own safe message;
 * anything else is logged here and answered with a generic 500 so no internals leak.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof ValidationError) return Response.json({ errors: error.errors }, { status: 400 });
  if (error instanceof Conflict) {
    return Response.json({ errors: { [error.field ?? "form"]: error.message } }, { status: 409 });
  }
  if (error instanceof Unauthorized) return message(401, error.message);
  if (error instanceof Forbidden) return message(403, error.message);
  if (error instanceof NotFound) return message(404, error.message);
  if (error instanceof TooManyAttempts) return message(429, error.message);
  if (!(error instanceof ApplicationError)) console.error(error);
  return message(500, "Internal server error");
}

/** Runs a route handler's work and turns anything it throws into the matching response. */
export async function handle(action: () => Response | Promise<Response>): Promise<Response> {
  try {
    return await action();
  } catch (error) {
    return errorResponse(error);
  }
}
