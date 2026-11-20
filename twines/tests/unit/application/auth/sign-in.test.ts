import { beforeEach, describe, expect, it } from "vitest";
import { TooManyAttempts, Unauthorized, ValidationError } from "@/application/errors";
import {
  DUMMY_PASSWORD_HASH,
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  SESSION_TTL_MS,
  signIn,
  type SignInDeps,
} from "@/application/auth/sign-in";
import { signOut } from "@/application/auth/sign-out";
import { getCurrentUser } from "@/application/auth/get-current-user";
import {
  FakeClock,
  FakePasswordHasher,
  FakeSessionTokens,
  InMemoryLoginThrottleStore,
  InMemorySessionStore,
  InMemoryUserRepository,
} from "./fakes";

const EMAIL = "ana@example.com";
const PASSWORD = "secret123";

describe("signIn", () => {
  let users: InMemoryUserRepository;
  let sessions: InMemorySessionStore;
  let throttles: InMemoryLoginThrottleStore;
  let hasher: FakePasswordHasher;
  let clock: FakeClock;
  let deps: SignInDeps;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    sessions = new InMemorySessionStore(users);
    throttles = new InMemoryLoginThrottleStore();
    hasher = new FakePasswordHasher();
    clock = new FakeClock();
    deps = { users, sessions, throttles, hasher, tokens: new FakeSessionTokens(), clock };
    await users.create({ email: EMAIL, passwordHash: await hasher.hash(PASSWORD), role: "owner" });
    hasher.verifiedAgainst.length = 0;
  });

  async function failTimes(count: number, email = EMAIL) {
    for (let i = 0; i < count; i += 1) {
      await expect(signIn(deps, { email, password: "wrong-pass1" })).rejects.toBeInstanceOf(Unauthorized);
    }
  }

  describe("AUTH-07 successful sign-in", () => {
    it("starts a session and returns the raw token for the caller to set as a cookie", async () => {
      const result = await signIn(deps, { email: EMAIL, password: PASSWORD });

      expect(result.token).toBe("token-1");
      expect(result.user.email).toBe(EMAIL);
      expect(result.expiresAt).toEqual(new Date(clock.now().getTime() + SESSION_TTL_MS));
    });

    it("stores only the hash of the token, valid for 7 days", async () => {
      const { token, expiresAt } = await signIn(deps, { email: EMAIL, password: PASSWORD });

      expect(sessions.sessions).toEqual([{ tokenHash: "sha(token-1)", userId: "user-1", expiresAt }]);
      expect(JSON.stringify(sessions.sessions)).not.toContain(`"${token}"`);
      expect(SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("is case-insensitive on the email", async () => {
      await expect(signIn(deps, { email: "  ANA@Example.com ", password: PASSWORD })).resolves.toBeDefined();
    });

    it("rejects malformed input before touching credentials", async () => {
      await expect(signIn(deps, { email: "ana@", password: PASSWORD })).rejects.toBeInstanceOf(ValidationError);
      await expect(signIn(deps, { email: EMAIL, password: "" })).rejects.toBeInstanceOf(ValidationError);
      await expect(signIn(deps, undefined)).rejects.toBeInstanceOf(ValidationError);
      expect(throttles.records.size).toBe(0);
    });
  });

  describe("AUTH-08 wrong password or unknown email", () => {
    it("gives the same error for a wrong password and for an unknown email", async () => {
      const wrongPassword = await signIn(deps, { email: EMAIL, password: "nope-1234" }).catch((e: unknown) => e);
      const unknownEmail = await signIn(deps, { email: "nobody@example.com", password: PASSWORD }).catch(
        (e: unknown) => e,
      );

      expect(wrongPassword).toBeInstanceOf(Unauthorized);
      expect(unknownEmail).toBeInstanceOf(Unauthorized);
      expect((wrongPassword as Error).message).toBe("Invalid email or password");
      expect((unknownEmail as Error).message).toBe("Invalid email or password");
      expect(sessions.sessions).toHaveLength(0);
    });

    it("still verifies a password against a dummy hash when the email is unknown", async () => {
      await expect(signIn(deps, { email: "nobody@example.com", password: PASSWORD })).rejects.toBeInstanceOf(
        Unauthorized,
      );

      expect(hasher.verifiedAgainst).toEqual([DUMMY_PASSWORD_HASH]);
    });

    it("verifies against the real hash when the email exists", async () => {
      await signIn(deps, { email: EMAIL, password: "nope-1234" }).catch(() => undefined);

      expect(hasher.verifiedAgainst).toEqual([`hashed(${PASSWORD})`]);
    });

    it("never signs in an unknown email, even if the hasher accepts the dummy hash", async () => {
      hasher.verify = async () => true;

      await expect(signIn(deps, { email: "nobody@example.com", password: PASSWORD })).rejects.toBeInstanceOf(
        Unauthorized,
      );
      expect(sessions.sessions).toHaveLength(0);
    });
  });

  describe("AUTH-10 lockout after repeated failures", () => {
    it("locks the email for 15 minutes at the 5th consecutive failure", async () => {
      await failTimes(MAX_FAILED_ATTEMPTS);

      expect(throttles.records.get(EMAIL)).toEqual({
        email: EMAIL,
        failedCount: 5,
        lockedUntil: new Date(clock.now().getTime() + 15 * 60 * 1000),
      });
      expect(LOCK_DURATION_MS).toBe(15 * 60 * 1000);
    });

    it("counts failures without locking before the 5th", async () => {
      await failTimes(4);

      expect(throttles.records.get(EMAIL)).toEqual({ email: EMAIL, failedCount: 4, lockedUntil: null });
      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).resolves.toBeDefined();
    });

    it("refuses even the correct password while locked and leaves the counter alone", async () => {
      await failTimes(5);
      const before = throttles.records.get(EMAIL);
      clock.advance(14 * 60 * 1000 + 59_000);

      const error = await signIn(deps, { email: EMAIL, password: PASSWORD }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(TooManyAttempts);
      expect((error as TooManyAttempts).message).toBe("Too many attempts, try again later");
      expect((error as TooManyAttempts).lockedUntil).toEqual(before?.lockedUntil);
      expect(throttles.records.get(EMAIL)).toEqual(before);
      expect(sessions.sessions).toHaveLength(0);
    });

    it("does not check the password while locked", async () => {
      await failTimes(5);
      hasher.verifiedAgainst.length = 0;

      await signIn(deps, { email: EMAIL, password: PASSWORD }).catch(() => undefined);

      expect(hasher.verifiedAgainst).toHaveLength(0);
    });

    it("locks an unknown email too, so the lockout does not reveal which accounts exist", async () => {
      await failTimes(5, "nobody@example.com");

      const error = await signIn(deps, { email: "nobody@example.com", password: PASSWORD }).catch(
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(TooManyAttempts);
      expect(throttles.records.get("nobody@example.com")?.failedCount).toBe(5);
    });

    it("keys the throttle by normalized email so case and spacing cannot dodge it", async () => {
      await failTimes(3);
      await signIn(deps, { email: " ANA@example.com ", password: "wrong-pass1" }).catch(() => undefined);
      await signIn(deps, { email: "Ana@Example.com", password: "wrong-pass1" }).catch(() => undefined);

      expect([...throttles.records.keys()]).toEqual([EMAIL]);
      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(TooManyAttempts);
    });

    it("does not lock one email because of failures on another", async () => {
      await failTimes(5, "nobody@example.com");

      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).resolves.toBeDefined();
    });
  });

  describe("AUTH-11 lockout expiry and reset", () => {
    it("evaluates the attempt normally once the lock has passed", async () => {
      await failTimes(5);
      clock.advance(LOCK_DURATION_MS);

      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).resolves.toBeDefined();
      expect(throttles.records.has(EMAIL)).toBe(false);
    });

    it("still refuses one millisecond before the lock ends", async () => {
      await failTimes(5);
      clock.advance(LOCK_DURATION_MS - 1);

      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(TooManyAttempts);
    });

    it("treats the counter as reset after the lock: one new failure does not re-lock", async () => {
      await failTimes(5);
      clock.advance(LOCK_DURATION_MS + 1000);

      await failTimes(1);

      expect(throttles.records.get(EMAIL)).toEqual({ email: EMAIL, failedCount: 1, lockedUntil: null });
      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).resolves.toBeDefined();
    });

    it("locks again after a full new round of failures once the previous lock expired", async () => {
      await failTimes(5);
      clock.advance(LOCK_DURATION_MS + 1000);
      await failTimes(5);

      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(TooManyAttempts);
    });

    it("resets the failure counter after a successful sign-in", async () => {
      await failTimes(4);
      await signIn(deps, { email: EMAIL, password: PASSWORD });

      expect(throttles.records.has(EMAIL)).toBe(false);
      await failTimes(4);
      await expect(signIn(deps, { email: EMAIL, password: PASSWORD })).resolves.toBeDefined();
    });
  });

  describe("AUTH-12 sign-out and current user", () => {
    it("returns the signed-in user for a live session token", async () => {
      const { token } = await signIn(deps, { email: EMAIL, password: PASSWORD });

      const current = await getCurrentUser(deps, token);

      expect(current?.email).toBe(EMAIL);
    });

    it("deletes the session on sign-out so the old token is unauthenticated", async () => {
      const { token } = await signIn(deps, { email: EMAIL, password: PASSWORD });

      await signOut(deps, token);

      expect(sessions.sessions).toHaveLength(0);
      expect(await getCurrentUser(deps, token)).toBeNull();
    });

    it("signs out only the given session and tolerates a missing or unknown token", async () => {
      const first = await signIn(deps, { email: EMAIL, password: PASSWORD });
      const second = await signIn(deps, { email: EMAIL, password: PASSWORD });

      await signOut(deps, first.token);
      await signOut(deps, undefined);
      await signOut(deps, "unknown-token");

      expect(await getCurrentUser(deps, first.token)).toBeNull();
      expect((await getCurrentUser(deps, second.token))?.email).toBe(EMAIL);
    });

    it("returns null when there is no token or the token is unknown", async () => {
      expect(await getCurrentUser(deps, undefined)).toBeNull();
      expect(await getCurrentUser(deps, null)).toBeNull();
      expect(await getCurrentUser(deps, "")).toBeNull();
      expect(await getCurrentUser(deps, "unknown-token")).toBeNull();
    });

    it("returns null once the session has expired", async () => {
      const { token } = await signIn(deps, { email: EMAIL, password: PASSWORD });

      clock.advance(SESSION_TTL_MS - 1);
      expect(await getCurrentUser(deps, token)).not.toBeNull();

      clock.advance(1);
      expect(await getCurrentUser(deps, token)).toBeNull();
    });
  });
});
