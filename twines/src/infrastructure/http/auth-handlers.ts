import { NextResponse } from "next/server";
import { signIn, type SignInDeps } from "@/application/auth/sign-in";
import { signOut } from "@/application/auth/sign-out";
import { signUp } from "@/application/auth/sign-up";
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
export function createAuthHandlers(deps: SignInDeps) {
  return {
    /** AUTH-01: creates an owner and signs them in right away. */
    signUp: (request: Request) =>
      handle(async () => {
        assertSameOrigin(request);
        const body = await readJson(request);
        const created = await signUp(deps, body);
        // `signUp` accepted the body, so it holds the validated password.
        const { password } = body as { password: string };
        const session = await signIn(deps, { email: created.email, password });

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
