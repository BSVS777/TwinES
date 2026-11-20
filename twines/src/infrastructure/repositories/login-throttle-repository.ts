import { LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS } from "@/application/auth/sign-in";
import type { LoginThrottle, LoginThrottleStore } from "@/application/ports";
import type { PrismaClient } from "@/generated/prisma/client";

export class PrismaLoginThrottleStore implements LoginThrottleStore {
  constructor(private readonly db: PrismaClient) {}

  async find(email: string): Promise<LoginThrottle | null> {
    return this.db.loginThrottle.findUnique({ where: { email } });
  }

  async save(throttle: LoginThrottle): Promise<void> {
    const { email, failedCount, lockedUntil } = throttle;
    await this.db.loginThrottle.upsert({
      where: { email },
      create: { email, failedCount, lockedUntil },
      update: { failedCount, lockedUntil },
    });
  }

  async recordFailure(email: string, now: Date): Promise<LoginThrottle> {
    // The whole sequence runs in one transaction, and the count itself is a database-side
    // increment, so concurrent failures can neither interleave nor overwrite each other.
    return this.db.$transaction(async (tx) => {
      // A lock that has run out starts a fresh count.
      await tx.loginThrottle.updateMany({
        where: { email, lockedUntil: { lte: now } },
        data: { failedCount: 0, lockedUntil: null },
      });
      const counted = await tx.loginThrottle.upsert({
        where: { email },
        create: { email, failedCount: 1, lockedUntil: null },
        update: { failedCount: { increment: 1 } },
      });
      if (counted.failedCount < MAX_FAILED_ATTEMPTS) return counted;

      return tx.loginThrottle.update({
        where: { email },
        data: { lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS) },
      });
    });
  }

  async reset(email: string): Promise<void> {
    await this.db.loginThrottle.deleteMany({ where: { email } });
  }
}
