import { describe, expect, it } from "vitest";
import { Forbidden } from "@/application/errors";
import { assertSameOrigin } from "@/infrastructure/http/origin-check";

const APP_URL = "http://localhost:3000/api/auth/sign-in";

function request(method: string, origin?: string, url = APP_URL) {
  return new Request(url, { method, headers: origin === undefined ? {} : { origin } });
}

describe("assertSameOrigin", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("accepts a %s from the app's own origin", (method) => {
    expect(() => assertSameOrigin(request(method, "http://localhost:3000"))).not.toThrow();
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("rejects a %s without an Origin header", (method) => {
    expect(() => assertSameOrigin(request(method))).toThrow(new Forbidden("Cross-origin request refused"));
  });

  it("rejects a foreign origin", () => {
    expect(() => assertSameOrigin(request("POST", "https://evil.example"))).toThrow(Forbidden);
  });

  it("compares the whole origin: scheme, host and port", () => {
    expect(() => assertSameOrigin(request("POST", "https://localhost:3000"))).toThrow(Forbidden);
    expect(() => assertSameOrigin(request("POST", "http://localhost:3001"))).toThrow(Forbidden);
    expect(() => assertSameOrigin(request("POST", "http://localhost.evil.example:3000"))).toThrow(Forbidden);
  });

  it("rejects the opaque origin sent by sandboxed or redirected requests", () => {
    expect(() => assertSameOrigin(request("POST", "null"))).toThrow(Forbidden);
  });

  it("follows the request's own host, not a fixed one", () => {
    const url = "https://twines.example/api/auth/sign-in";

    expect(() => assertSameOrigin(request("POST", "https://twines.example", url))).not.toThrow();
    expect(() => assertSameOrigin(request("POST", "http://localhost:3000", url))).toThrow(Forbidden);
  });

  it.each(["GET", "HEAD", "OPTIONS"])("lets a safe %s through without checking Origin", (method) => {
    expect(() => assertSameOrigin(request(method))).not.toThrow();
    expect(() => assertSameOrigin(request(method, "https://evil.example"))).not.toThrow();
  });
});
