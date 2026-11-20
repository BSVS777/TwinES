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
