import { afterEach, describe, expect, it, vi } from "vitest";
import { Forbidden } from "@/application/errors";
import { assertSameOrigin } from "@/infrastructure/http/origin-check";

const APP_URL = "http://localhost:3000/api/auth/sign-in";

function request(method: string, origin?: string, url = APP_URL) {
  return new Request(url, { method, headers: origin === undefined ? {} : { origin } });
}

describe("assertSameOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  describe("APP_ORIGIN behind a TLS-terminating proxy", () => {
    const PROXIED_URL = "http://127.0.0.1:3000/api/auth/sign-in";

    it("compares against APP_ORIGIN instead of the request URL when it is set", () => {
      vi.stubEnv("APP_ORIGIN", "https://twines.example");

      expect(() => assertSameOrigin(request("POST", "https://twines.example", PROXIED_URL))).not.toThrow();
      expect(() => assertSameOrigin(request("POST", "http://127.0.0.1:3000", PROXIED_URL))).toThrow(Forbidden);
      expect(() => assertSameOrigin(request("POST", "https://evil.example", PROXIED_URL))).toThrow(Forbidden);
    });

    it("tolerates a trailing slash in APP_ORIGIN by comparing only its origin", () => {
      vi.stubEnv("APP_ORIGIN", "https://twines.example/");

      expect(() => assertSameOrigin(request("POST", "https://twines.example", PROXIED_URL))).not.toThrow();
    });

    it.each(["", "   "])("falls back to the request origin when APP_ORIGIN is blank (%j)", (value) => {
      vi.stubEnv("APP_ORIGIN", value);

      expect(() => assertSameOrigin(request("POST", "http://127.0.0.1:3000", PROXIED_URL))).not.toThrow();
      expect(() => assertSameOrigin(request("POST", "https://twines.example", PROXIED_URL))).toThrow(Forbidden);
    });

    it("refuses mutating requests when APP_ORIGIN is not a valid URL instead of guessing", () => {
      vi.stubEnv("APP_ORIGIN", "not a url");

      expect(() => assertSameOrigin(request("POST", "http://localhost:3000"))).toThrow(Forbidden);
    });

    it("still lets safe methods through", () => {
      vi.stubEnv("APP_ORIGIN", "https://twines.example");

      expect(() => assertSameOrigin(request("GET", undefined, PROXIED_URL))).not.toThrow();
    });
  });
});
