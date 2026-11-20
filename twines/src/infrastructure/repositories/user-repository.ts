import { Conflict } from "@/application/errors";
import type { NewUser, Role, User, UserRepository } from "@/application/ports";
import type { PrismaClient } from "@/generated/prisma/client";
import { uniqueViolationFields } from "./prisma-errors";

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

/** Maps a row to the port type; `role` is only ever written from the `Role` union. */
export function toUser(row: UserRow): User {
  return { ...row, role: row.role as Role };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: NewUser): Promise<User> {
    try {
      return toUser(await this.db.user.create({ data: input }));
    } catch (error) {
      if (uniqueViolationFields(error)?.includes("email")) {
        throw new Conflict("This email is already registered", "email");
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email } });
    return row && toUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row && toUser(row);
  }
}
