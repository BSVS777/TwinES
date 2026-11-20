import { NextRequest, type NextResponse } from "next/server";
import { SESSION_TTL_MS } from "@/application/auth/sign-in";

export const SESSION_COOKIE = "twines_session";

export interface SessionCookieOptions {
  /** Sent only over HTTPS. Production turns this on. */
  secure: boolean;
}

const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

function attributes({ secure }: SessionCookieOptions) {
  return { httpOnly: true, sameSite: "lax", secure, path: "/" } as const;
}

type CookieReader = Pick<NextRequest["cookies"], "get">;

/**
 * Next.js passes route handlers and the proxy its own request class, which already parses
 * cookies and cannot be wrapped a second time. A plain `Request` is wrapped so tests can use one.
 */
function cookiesOf(request: Request): CookieReader {
  return "cookies" in request ? (request as NextRequest).cookies : new NextRequest(request).cookies;
}

/** The raw session token from the request's cookies, or null when there is none. */
export function readSessionToken(request: Request): string | null {
  return cookiesOf(request).get(SESSION_COOKIE)?.value || null;
}

export function setSessionCookie(response: NextResponse, token: string, options: SessionCookieOptions): void {
  response.cookies.set(SESSION_COOKIE, token, { ...attributes(options), maxAge: SESSION_TTL_SECONDS });
}

export function clearSessionCookie(response: NextResponse, options: SessionCookieOptions): void {
  response.cookies.set(SESSION_COOKIE, "", { ...attributes(options), maxAge: 0 });
}
