import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from "@/infrastructure/auth/session-cookie";

function requestWithCookie(cookie?: string) {
  return new Request("http://localhost:3000/api/auth/sign-out", {
    method: "POST",
    headers: cookie === undefined ? {} : { cookie },
  });
}

function setCookieOf(response: NextResponse): string {
  return response.headers.get("set-cookie") ?? "";
}

describe("session cookie", () => {
  it("is named twines_session", () => {
    expect(SESSION_COOKIE).toBe("twines_session");
  });

  describe("readSessionToken", () => {
    it("returns the token among other cookies", () => {
      expect(readSessionToken(requestWithCookie("theme=dark; twines_session=abc123; lang=en"))).toBe("abc123");
    });

    it("returns null when the cookie is absent or empty", () => {
      expect(readSessionToken(requestWithCookie())).toBeNull();
      expect(readSessionToken(requestWithCookie("theme=dark"))).toBeNull();
      expect(readSessionToken(requestWithCookie("twines_session="))).toBeNull();
    });
  });

  describe("readSessionToken with a request that already parses cookies", () => {
    it("reads from its cookies instead of building a second request from it", () => {
      // Next.js hands route handlers its own request class, which cannot be wrapped again.
      const request = Object.assign(requestWithCookie("twines_session=from-header"), {
        cookies: { get: (name: string) => (name === "twines_session" ? { value: "from-parsed-cookies" } : undefined) },
      });

      expect(readSessionToken(request)).toBe("from-parsed-cookies");
    });

    it("returns null when its parsed cookies have no session", () => {
      const request = Object.assign(requestWithCookie(), { cookies: { get: () => undefined } });

      expect(readSessionToken(request)).toBeNull();
    });
  });

  describe("setSessionCookie", () => {
    it("sets an httpOnly, SameSite=Lax cookie on the whole site for 7 days (AUTH-09)", () => {
      const response = NextResponse.json({});

      setSessionCookie(response, "abc123", { secure: false });

      const header = setCookieOf(response);
      expect(header).toContain("twines_session=abc123");
      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=lax");
      expect(header).toContain("Path=/");
      expect(header).toContain("Max-Age=604800");
      expect(header).not.toContain("Secure");
    });

    it("adds Secure when asked, which production does", () => {
      const response = NextResponse.json({});

      setSessionCookie(response, "abc123", { secure: true });

      expect(setCookieOf(response)).toContain("Secure");
    });
  });

  describe("clearSessionCookie", () => {
    it("expires the cookie immediately with the same attributes", () => {
      const response = NextResponse.json({});

      clearSessionCookie(response, { secure: true });

      const header = setCookieOf(response);
      expect(header).toContain("twines_session=;");
      expect(header).toContain("Max-Age=0");
      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=lax");
      expect(header).toContain("Path=/");
      expect(header).toContain("Secure");
    });
  });
});
