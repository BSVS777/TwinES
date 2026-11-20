import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/application/auth/get-current-user";
import { MAX_FAILED_ATTEMPTS, type SignInDeps } from "@/application/auth/sign-in";
import { createAuthHandlers } from "@/infrastructure/http/auth-handlers";
import {
  FakeClock,
  FakePasswordHasher,
  FakeSessionTokens,
  InMemoryLoginThrottleStore,
  InMemorySessionStore,
  InMemoryUserRepository,
} from "../../application/auth/fakes";

const ORIGIN = "http://localhost:3000";
const EMAIL = "ana@example.com";
const PASSWORD = "secret123";

function post(path: string, body: unknown, headers: Record<string, string> = { origin: ORIGIN }) {
  return new Request(`${ORIGIN}/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function sessionToken(response: Response): string | null {
  return /twines_session=([^;]*)/.exec(response.headers.get("set-cookie") ?? "")?.[1] || null;
}

describe("auth route handlers", () => {
  let users: InMemoryUserRepository;
  let sessions: InMemorySessionStore;
  let throttles: InMemoryLoginThrottleStore;
  let deps: SignInDeps;
  let handlers: ReturnType<typeof createAuthHandlers>;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    sessions = new InMemorySessionStore(users);
    throttles = new InMemoryLoginThrottleStore();
    deps = {
      users,
      sessions,
      throttles,
      hasher: new FakePasswordHasher(),
      tokens: new FakeSessionTokens(),
      clock: new FakeClock(),
    };
    handlers = createAuthHandlers(deps);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function signUpAna() {
    return handlers.signUp(post("sign-up", { email: EMAIL, password: PASSWORD }));
  }

  describe("POST /api/auth/sign-up", () => {
    it("AUTH-01 creates an owner, signs them in and returns only the public user", async () => {
      const response = await handlers.signUp(post("sign-up", { email: "Ana@Example.com", password: PASSWORD }));

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ user: { id: "user-1", email: EMAIL, role: "owner" } });
      const token = sessionToken(response);
      expect(token).toBe("token-1");
      expect((await getCurrentUser(deps, token))?.email).toBe(EMAIL);
    });

    it("AUTH-01 signs up and sets the cookie even when the email was locked by earlier failed sign-ins", async () => {
      for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
        await handlers.signIn(post("sign-in", { email: EMAIL, password: "nope-1234" }));
      }
      expect((await throttles.find(EMAIL))?.lockedUntil).not.toBeNull();

      const response = await signUpAna();

      expect(response.status).toBe(201);
      expect(sessionToken(response)).toBe("token-1");
      expect(await throttles.find(EMAIL)).toBeNull();
      const signedIn = await handlers.signIn(post("sign-in", { email: EMAIL, password: PASSWORD }));
      expect(signedIn.status).toBe(200);
    });

    it("AUTH-09 sets the session cookie httpOnly and SameSite=Lax", async () => {
      const header = (await signUpAna()).headers.get("set-cookie") ?? "";

      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=lax");
      expect(header).toContain("Path=/");
    });

    it("AUTH-06 ignores a role in the request", async () => {
      const response = await handlers.signUp(
        post("sign-up", { email: EMAIL, password: PASSWORD, role: "technician" }),
      );

      expect((await response.json()).user.role).toBe("owner");
      expect(users.users[0].role).toBe("owner");
    });

    it("AUTH-02 answers 409 with the duplicate email message under the email field", async () => {
      await signUpAna();

      const response = await handlers.signUp(post("sign-up", { email: "ANA@example.com", password: "other1234" }));

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ errors: { email: "An account with this email already exists" } });
      expect(response.headers.get("set-cookie")).toBeNull();
    });

    it("AUTH-03 and AUTH-04 answer 400 with one message per invalid field", async () => {
      const response = await handlers.signUp(post("sign-up", { email: "ana@", password: "abcdefg" }));
      const { errors } = await response.json();

      expect(response.status).toBe(400);
      expect(errors.email).toBe("Enter a valid email address");
      expect(errors.password).toBe("Password must have at least 8 characters, including a letter and a digit");
      expect(users.users).toHaveLength(0);
    });

    it("answers 400 for a body that is not JSON", async () => {
      const response = await handlers.signUp(post("sign-up", "not json"));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ errors: { form: "Invalid input" } });
    });

    it("refuses a foreign Origin with 403 and creates nothing", async () => {
      const response = await handlers.signUp(
        post("sign-up", { email: EMAIL, password: PASSWORD }, { origin: "https://evil.example" }),
      );

      expect(response.status).toBe(403);
      expect(users.users).toHaveLength(0);
      expect(response.headers.get("set-cookie")).toBeNull();
    });

    it("refuses a request without Origin with 403", async () => {
      const response = await handlers.signUp(post("sign-up", { email: EMAIL, password: PASSWORD }, {}));

      expect(response.status).toBe(403);
      expect(users.users).toHaveLength(0);
    });
  });

  describe("POST /api/auth/sign-in", () => {
    beforeEach(signUpAna);

    it("AUTH-07 signs in and returns the public user with a session cookie", async () => {
      const response = await handlers.signIn(post("sign-in", { email: "ANA@example.com", password: PASSWORD }));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ user: { id: "user-1", email: EMAIL, role: "owner" } });
      expect(sessionToken(response)).toBe("token-2");
    });

    it("AUTH-09 sets the cookie httpOnly, SameSite=Lax, for 7 days, without Secure outside production", async () => {
      const header =
        (await handlers.signIn(post("sign-in", { email: EMAIL, password: PASSWORD }))).headers.get("set-cookie") ??
        "";

      expect(header).toContain("HttpOnly");
      expect(header).toContain("SameSite=lax");
      expect(header).toContain("Max-Age=604800");
      expect(header).not.toContain("Secure");
    });

    it("marks the cookie Secure in production", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const response = await handlers.signIn(post("sign-in", { email: EMAIL, password: PASSWORD }));

      expect(response.headers.get("set-cookie")).toContain("Secure");
    });

    it("AUTH-08 answers 401 with the same generic message for a wrong password and an unknown email", async () => {
      const wrongPassword = await handlers.signIn(post("sign-in", { email: EMAIL, password: "nope-1234" }));
      const unknownEmail = await handlers.signIn(post("sign-in", { email: "nobody@example.com", password: PASSWORD }));

      for (const response of [wrongPassword, unknownEmail]) {
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: "Invalid email or password" });
        expect(response.headers.get("set-cookie")).toBeNull();
      }
    });

    it("AUTH-10 answers 429 once the email is locked, even for the correct password", async () => {
      for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
        await handlers.signIn(post("sign-in", { email: EMAIL, password: "nope-1234" }));
      }

      const response = await handlers.signIn(post("sign-in", { email: EMAIL, password: PASSWORD }));

      expect(response.status).toBe(429);
      expect(await response.json()).toEqual({ error: "Too many attempts, try again later" });
      expect(response.headers.get("set-cookie")).toBeNull();
    });

    it("answers 400 when the email or password is missing", async () => {
      const response = await handlers.signIn(post("sign-in", {}));

      expect(response.status).toBe(400);
      expect(Object.keys((await response.json()).errors).sort()).toEqual(["email", "password"]);
    });

    it("refuses a foreign Origin with 403 before touching credentials or the throttle", async () => {
      const response = await handlers.signIn(
        post("sign-in", { email: EMAIL, password: "nope-1234" }, { origin: "https://evil.example" }),
      );

      expect(response.status).toBe(403);
      expect(throttles.records.size).toBe(0);
    });
  });

  describe("POST /api/auth/sign-out", () => {
    function signOutRequest(token: string | null, headers: Record<string, string> = { origin: ORIGIN }) {
      return new Request(`${ORIGIN}/api/auth/sign-out`, {
        method: "POST",
        headers: { ...headers, ...(token ? { cookie: `twines_session=${token}` } : {}) },
      });
    }

    it("AUTH-12 deletes the session, clears the cookie and leaves the old token unauthenticated", async () => {
      const token = sessionToken(await signUpAna());

      const response = await handlers.signOut(signOutRequest(token));

      expect(response.status).toBe(204);
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
      expect(sessions.sessions).toHaveLength(0);
      expect(await getCurrentUser(deps, token)).toBeNull();
    });

    it("is idempotent for a request that has no session cookie", async () => {
      const response = await handlers.signOut(signOutRequest(null));

      expect(response.status).toBe(204);
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    });

    it("refuses a foreign Origin with 403 and keeps the session alive", async () => {
      const token = sessionToken(await signUpAna());

      const response = await handlers.signOut(signOutRequest(token, { origin: "https://evil.example" }));

      expect(response.status).toBe(403);
      expect(sessions.sessions).toHaveLength(1);
      expect(response.headers.get("set-cookie")).toBeNull();
    });

    it("refuses a request without Origin with 403", async () => {
      const token = sessionToken(await signUpAna());

      expect((await handlers.signOut(signOutRequest(token, {}))).status).toBe(403);
      expect(sessions.sessions).toHaveLength(1);
    });
  });
});
