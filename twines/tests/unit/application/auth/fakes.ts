import { Conflict } from "@/application/errors";
import type { NewUser, PasswordHasher, User, UserRepository } from "@/application/ports";

/** In-memory user store that enforces the same unique-email rule as the database. */
export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];

  async create(input: NewUser): Promise<User> {
    if (this.users.some((user) => user.email === input.email)) {
      throw new Conflict("This email is already registered", "email");
    }
    const user: User = {
      ...input,
      id: `user-${this.users.length + 1}`,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    };
    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }
}

/** Deterministic hasher: no real cryptography, so tests stay instant. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed(${plain})`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed(${plain})`;
  }
}
