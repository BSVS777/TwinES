import { Forbidden } from "@/application/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * The origin the app is served from. `APP_ORIGIN` wins when set, because behind a TLS-terminating
 * proxy the request URL carries the internal scheme and host, not the one browsers use. Without
 * it the request's own origin is used. A set but malformed value yields `null`, which matches no
 * `Origin` header, so mutating requests are refused rather than checked against a guess.
 */
function expectedOrigin(request: Request): string | null {
  const configured = process.env.APP_ORIGIN?.trim();
  if (!configured) return new URL(request.url).origin;
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/**
 * CSRF defense for mutating requests: the `Origin` header must be present and equal to the
 * app's origin. Browsers always attach it to cross-site writes, so a missing or foreign value
 * is refused. Safe methods never change state and are not checked.
 */
export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  const origin = request.headers.get("origin");
  if (origin === null || origin !== expectedOrigin(request)) {
    throw new Forbidden("Cross-origin request refused");
  }
}
