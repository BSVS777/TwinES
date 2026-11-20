import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-hasher";
import { SystemClock } from "@/infrastructure/auth/clock";
import { CryptoSessionTokens } from "@/infrastructure/auth/session-token";
import { createContainer } from "@/infrastructure/container";
import { PrismaLoginThrottleStore } from "@/infrastructure/repositories/login-throttle-repository";
import { PrismaSessionStore } from "@/infrastructure/repositories/session-repository";
import { PrismaUserRepository } from "@/infrastructure/repositories/user-repository";

describe("createContainer", () => {
  it("wires the production adapters for every port the auth use cases need", () => {
    const container = createContainer({} as PrismaClient);

    expect(container.users).toBeInstanceOf(PrismaUserRepository);
    expect(container.sessions).toBeInstanceOf(PrismaSessionStore);
    expect(container.throttles).toBeInstanceOf(PrismaLoginThrottleStore);
    expect(container.hasher).toBeInstanceOf(BcryptPasswordHasher);
    expect(container.tokens).toBeInstanceOf(CryptoSessionTokens);
    expect(container.clock).toBeInstanceOf(SystemClock);
  });

  it("builds a separate set of adapters on every call", () => {
    const db = {} as PrismaClient;

    expect(createContainer(db)).not.toBe(createContainer(db));
  });
});
