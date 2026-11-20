import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken } from "@/infrastructure/auth/session-cookie";

/**
 * Fast path for route protection (AUTH-13): a page request without a session cookie goes to
 * the sign-in page. It only looks at whether the cookie is there; the real session check stays
 * in the use cases, so a forged or expired cookie gets past here and is rejected there.
 */
export function proxy(request: NextRequest) {
  if (readSessionToken(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}

// The API is not redirected: its handlers answer 401 themselves (AUTH-14).
export const config = {
  matcher: ["/vehicles/:path*", "/technician/:path*"],
};
