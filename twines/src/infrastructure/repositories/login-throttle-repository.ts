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

  async reset(email: string): Promise<void> {
    await this.db.loginThrottle.deleteMany({ where: { email } });
  }
}
