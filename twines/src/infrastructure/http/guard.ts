import { getCurrentUser, type GetCurrentUserDeps } from "@/application/auth/get-current-user";
import { Unauthorized } from "@/application/errors";
import type { PublicUser } from "@/application/ports";
import { readSessionToken } from "@/infrastructure/auth/session-cookie";
import { handle } from "@/infrastructure/http/handle";
import { assertSameOrigin } from "@/infrastructure/http/origin-check";

/** An unreadable body is passed on as `undefined`, which input validation reports as a 400. */
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined);
}

/**
 * The shared front door of the authenticated endpoints. `guarded` resolves the session first
 * (AUTH-14); mutating requests pass the `Origin` check before anything else.
 */
export function createGuard(deps: GetCurrentUserDeps) {
  /** The signed-in user behind the request's cookie, or a 401 (AUTH-14). */
  async function authenticate(request: Request): Promise<PublicUser> {
    const user = await getCurrentUser(deps, readSessionToken(request));
    if (!user) throw new Unauthorized();
    return user;
  }

  /** Runs `action` for the authenticated user; `mutating` requests pass the CSRF check first. */
  return function guarded(
    request: Request,
    mutating: boolean,
    action: (user: PublicUser) => Promise<Response>,
  ): Promise<Response> {
    return handle(async () => {
      if (mutating) assertSameOrigin(request);
      return action(await authenticate(request));
    });
  };
}
