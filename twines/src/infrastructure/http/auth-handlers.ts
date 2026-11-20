import { NextResponse } from "next/server";
import { signIn, type SignInDeps } from "@/application/auth/sign-in";
import { signOut } from "@/application/auth/sign-out";
import { signUpWithSession, type SignUpWithSessionDeps } from "@/application/auth/sign-up-with-session";
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
  type SessionCookieOptions,
} from "@/infrastructure/auth/session-cookie";
import { handle } from "@/infrastructure/http/handle";
import { assertSameOrigin } from "@/infrastructure/http/origin-check";

/** The Secure flag follows the environment at request time, so tests can flip it. */
function cookieOptions(): SessionCookieOptions {
  return { secure: process.env.NODE_ENV === "production" };
}

/** An unreadable body is passed on as `undefined`, which input validation reports as a 400. */
async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => undefined);
}

/**
 * Request handlers for the auth endpoints. They live outside the route files because a Next.js
 * route module may only export HTTP methods, and so tests can call them with plain `Request`s.
 * Responses expose only the public user and the session cookie, never the password hash.
 */
export function createAuthHandlers(deps: SignInDeps & SignUpWithSessionDeps) {
  return {
    /** AUTH-01: creates an owner and starts their session directly, never through the throttled sign-in. */
    signUp: (request: Request) =>
      handle(async () => {
        assertSameOrigin(request);
        const session = await signUpWithSession(deps, await readJson(request));

        const response = NextResponse.json({ user: session.user }, { status: 201 });
        setSessionCookie(response, session.token, cookieOptions());
        return response;
      }),

    /** AUTH-07 and AUTH-09: starts a session and sets the cookie. */
    signIn: (request: Request) =>
      handle(async () => {
        assertSameOrigin(request);
        const session = await signIn(deps, await readJson(request));

        const response = NextResponse.json({ user: session.user });
        setSessionCookie(response, session.token, cookieOptions());
        return response;
      }),

    /** AUTH-12: ends the session behind the cookie, if any, and clears the cookie. */
    signOut: (request: Request) =>
      handle(async () => {
        assertSameOrigin(request);
        await signOut(deps, readSessionToken(request));

        const response = new NextResponse(null, { status: 204 });
        clearSessionCookie(response, cookieOptions());
        return response;
      }),
  };
}
