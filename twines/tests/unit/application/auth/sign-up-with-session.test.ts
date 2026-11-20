import { beforeEach, describe, expect, it } from "vitest";
import { Conflict, ValidationError } from "@/application/errors";
import { MAX_FAILED_ATTEMPTS, SESSION_TTL_MS } from "@/application/auth/sign-in";
import { startSession } from "@/application/auth/start-session";
import { signUpWithSession, type SignUpWithSessionDeps } from "@/application/auth/sign-up-with-session";
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

describe("signUpWithSession", () => {
  let users: InMemoryUserRepository;
  let sessions: InMemorySessionStore;
  let throttles: InMemoryLoginThrottleStore;
  let hasher: FakePasswordHasher;
  let clock: FakeClock;
  let deps: SignUpWithSessionDeps;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    sessions = new InMemorySessionStore(users);
    throttles = new InMemoryLoginThrottleStore();
    hasher = new FakePasswordHasher();
    clock = new FakeClock();
    deps = { users, sessions, throttles, hasher, tokens: new FakeSessionTokens(), clock };
  });

  it("AUTH-01 creates the owner and starts a session without going through sign-in", async () => {
    const result = await signUpWithSession(deps, { email: "Ana@Example.com", password: PASSWORD });

    expect(result.user).toEqual({ id: "user-1", email: EMAIL, role: "owner" });
    expect(result.token).toBe("token-1");
    expect(result.expiresAt).toEqual(new Date(clock.now().getTime() + SESSION_TTL_MS));
    expect((await getCurrentUser(deps, result.token))?.email).toBe(EMAIL);
    expect(hasher.verifiedAgainst).toEqual([]);
  });

  it("AUTH-01 still succeeds when the email was locked by failed attempts before the account existed", async () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      await throttles.recordFailure(EMAIL, clock.now());
    }
    expect((await throttles.find(EMAIL))?.lockedUntil).not.toBeNull();

    const result = await signUpWithSession(deps, { email: EMAIL, password: PASSWORD });

    expect(result.token).toBe("token-1");
    expect(sessions.sessions).toHaveLength(1);
  });

  it("resets the throttle of the new account so its first real sign-in is not locked", async () => {
    await throttles.recordFailure(EMAIL, clock.now());

    await signUpWithSession(deps, { email: EMAIL, password: PASSWORD });

    expect(await throttles.find(EMAIL)).toBeNull();
  });

  it("keys the throttle reset by the normalized email", async () => {
    await throttles.recordFailure(EMAIL, clock.now());

    await signUpWithSession(deps, { email: "  ANA@example.com ", password: PASSWORD });

    expect(throttles.records.size).toBe(0);
  });

  it("does not touch the throttle or create a session when sign-up is rejected", async () => {
    await users.create({ email: EMAIL, passwordHash: "x", role: "owner" });
    await throttles.recordFailure(EMAIL, clock.now());

    await expect(signUpWithSession(deps, { email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(Conflict);
    await expect(signUpWithSession(deps, { email: "bad", password: "x" })).rejects.toBeInstanceOf(ValidationError);

    expect(throttles.records.get(EMAIL)?.failedCount).toBe(1);
    expect(sessions.sessions).toHaveLength(0);
  });
});

describe("startSession", () => {
  it("creates a session valid for 7 days and returns the raw token with the public user", async () => {
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionStore(users);
    const clock = new FakeClock();
    const tokens = new FakeSessionTokens();
    const user = { id: "user-1", email: EMAIL, role: "owner" as const };

    const result = await startSession({ sessions, tokens, clock }, user);

    expect(result).toEqual({ token: "token-1", user, expiresAt: new Date(clock.now().getTime() + SESSION_TTL_MS) });
    expect(sessions.sessions).toEqual([
      { tokenHash: "sha(token-1)", userId: "user-1", expiresAt: result.expiresAt },
    ]);
  });
});
