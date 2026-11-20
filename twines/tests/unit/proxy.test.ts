import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

function visit(path: string, cookie?: string) {
  return proxy(
    new NextRequest(`http://localhost:3000${path}`, { headers: cookie === undefined ? {} : { cookie } }),
  );
}

describe("proxy (AUTH-13 route protection)", () => {
  it.each(["/vehicles", "/vehicles/new", "/vehicles/abc123/edit", "/technician", "/technician/vehicles"])(
    "redirects an anonymous request for %s to the sign-in page",
    (path) => {
      const response = visit(path);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in");
    },
  );

  it("redirects when the session cookie is empty or only other cookies are present", () => {
    expect(visit("/vehicles", "twines_session=").headers.get("location")).toBe("http://localhost:3000/sign-in");
    expect(visit("/vehicles", "theme=dark").headers.get("location")).toBe("http://localhost:3000/sign-in");
  });

  it.each(["/vehicles", "/vehicles/abc123", "/technician"])(
    "lets a request with a session cookie through to %s",
    (path) => {
      const response = visit(path, "twines_session=abc123");

      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("runs only for vehicle and technician pages, never for the API or the auth pages", () => {
    expect(config.matcher).toEqual(["/vehicles/:path*", "/technician/:path*"]);
  });
});
