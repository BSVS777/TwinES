import type { NewSession, SessionStore, User } from "@/application/ports";
import type { PrismaClient } from "@/generated/prisma/client";
import { toUser } from "./user-repository";

export class PrismaSessionStore implements SessionStore {
  constructor(private readonly db: PrismaClient) {}

  async create(session: NewSession): Promise<void> {
    await this.db.session.create({
      data: { id: session.tokenHash, userId: session.userId, expiresAt: session.expiresAt },
    });
  }

  async findUserByTokenHash(tokenHash: string, now: Date): Promise<User | null> {
    const session = await this.db.session.findFirst({
      where: { id: tokenHash, expiresAt: { gt: now } },
      include: { user: true },
    });
    return session && toUser(session.user);
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.session.deleteMany({ where: { id: tokenHash } });
  }
}
