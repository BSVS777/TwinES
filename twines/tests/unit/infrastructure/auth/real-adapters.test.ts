import { describe, expect, it } from "vitest";
import { signIn, DUMMY_PASSWORD_HASH } from "@/application/auth/sign-in";
import { signUp } from "@/application/auth/sign-up";
import { getCurrentUser } from "@/application/auth/get-current-user";
import { signOut } from "@/application/auth/sign-out";
import { Unauthorized } from "@/application/errors";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-hasher";
import { CryptoSessionTokens } from "@/infrastructure/auth/session-token";
import { FakeClock, InMemoryLoginThrottleStore, InMemorySessionStore, InMemoryUserRepository } from "../../application/auth/fakes";

describe("auth use cases with the real hasher and token adapters", () => {
  it("the dummy hash is a well-formed bcrypt hash that no password matches", async () => {
    const hasher = new BcryptPasswordHasher(4);

    expect(DUMMY_PASSWORD_HASH).toMatch(/^\$2b\$12\$[./A-Za-z0-9]{53}$/);
    await expect(hasher.verify("secret123", DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });

  it("signs up, signs in, resolves the user and signs out end to end", async () => {
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionStore(users);
    const deps = {
      users,
      sessions,
      throttles: new InMemoryLoginThrottleStore(),
      hasher: new BcryptPasswordHasher(4),
      tokens: new CryptoSessionTokens(),
      clock: new FakeClock(),
    };

    await signUp(deps, { email: "Ana@Example.com", password: "secret123" });
    await expect(signIn(deps, { email: "ana@example.com", password: "secret124" })).rejects.toBeInstanceOf(
      Unauthorized,
    );
    const { token } = await signIn(deps, { email: "ana@example.com", password: "secret123" });

    expect(sessions.sessions[0].tokenHash).toBe(deps.tokens.hash(token));
    expect(sessions.sessions[0].tokenHash).not.toBe(token);
    expect((await getCurrentUser(deps, token))?.email).toBe("ana@example.com");

    await signOut(deps, token);
    expect(await getCurrentUser(deps, token)).toBeNull();
  });
});
