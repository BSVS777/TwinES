import type { SignInDeps } from "@/application/auth/sign-in";
import type { VehicleRepository } from "@/application/ports";
import type { PrismaClient } from "@/generated/prisma/client";
import { BcryptPasswordHasher } from "@/infrastructure/auth/bcrypt-hasher";
import { SystemClock } from "@/infrastructure/auth/clock";
import { CryptoSessionTokens } from "@/infrastructure/auth/session-token";
import { getDb } from "@/infrastructure/db";
import { PrismaLoginThrottleStore } from "@/infrastructure/repositories/login-throttle-repository";
import { PrismaSessionStore } from "@/infrastructure/repositories/session-repository";
import { PrismaUserRepository } from "@/infrastructure/repositories/user-repository";
import { PrismaVehicleRepository } from "@/infrastructure/repositories/vehicle-repository";

/** Every port implementation the use cases need. Later features add their repositories here. */
export type Container = SignInDeps & { vehicles: VehicleRepository };

/** Composition root: the only place that picks concrete adapters for the application ports. */
export function createContainer(db: PrismaClient): Container {
  return {
    users: new PrismaUserRepository(db),
    sessions: new PrismaSessionStore(db),
    throttles: new PrismaLoginThrottleStore(db),
    vehicles: new PrismaVehicleRepository(db),
    hasher: new BcryptPasswordHasher(),
    tokens: new CryptoSessionTokens(),
    clock: new SystemClock(),
  };
}

const globalForContainer = globalThis as unknown as { twinesContainer?: Container };

/** The shared container, built on first use so importing this module never needs the environment. */
export function getContainer(): Container {
  globalForContainer.twinesContainer ??= createContainer(getDb());
  return globalForContainer.twinesContainer;
}
