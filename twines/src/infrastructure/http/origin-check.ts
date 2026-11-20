import { Forbidden } from "@/application/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defense for mutating requests: the `Origin` header must be present and equal to the
 * origin the request was sent to. Browsers always attach it to cross-site writes, so a missing
 * or foreign value is refused. Safe methods never change state and are not checked.
 */
export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new Forbidden("Cross-origin request refused");
  }
}
