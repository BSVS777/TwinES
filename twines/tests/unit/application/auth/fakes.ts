import { Conflict } from "@/application/errors";
import type {
  Clock,
  LoginThrottle,
  LoginThrottleStore,
  NewSession,
  NewUser,
  PasswordHasher,
  SessionStore,
  SessionTokens,
  User,
  UserRepository,
} from "@/application/ports";
import { LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS } from "@/application/auth/sign-in";
import { parseCalendarDate, type CalendarDate } from "@/domain/shared/calendar-date";

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
  /** Every hash a password was checked against, in call order. */
  readonly verifiedAgainst: string[] = [];

  async hash(plain: string): Promise<string> {
    return `hashed(${plain})`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    this.verifiedAgainst.push(hash);
    return hash === `hashed(${plain})`;
  }
}

/** Clock the test moves by hand; `today()` is the UTC date of `now()`. */
export class FakeClock implements Clock {
  constructor(private current: Date = new Date("2026-03-10T12:00:00Z")) {}

  now(): Date {
    return new Date(this.current);
  }

  today(): CalendarDate {
    return parseCalendarDate(this.current.toISOString().slice(0, 10));
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

/** Predictable tokens: `token-1`, `token-2`, ... and a visibly different "hash". */
export class FakeSessionTokens implements SessionTokens {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `token-${this.counter}`;
  }

  hash(token: string): string {
    return `sha(${token})`;
  }
}

export class InMemorySessionStore implements SessionStore {
  readonly sessions: NewSession[] = [];

  constructor(private readonly users: UserRepository) {}

  async create(session: NewSession): Promise<void> {
    this.sessions.push(session);
  }

  async findUserByTokenHash(tokenHash: string, now: Date): Promise<User | null> {
    const session = this.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (!session || session.expiresAt.getTime() <= now.getTime()) return null;
    return this.users.findById(session.userId);
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const index = this.sessions.findIndex((candidate) => candidate.tokenHash === tokenHash);
    if (index >= 0) this.sessions.splice(index, 1);
  }
}

export class InMemoryLoginThrottleStore implements LoginThrottleStore {
  readonly records = new Map<string, LoginThrottle>();

  async find(email: string): Promise<LoginThrottle | null> {
    return this.records.get(email) ?? null;
  }

  async save(throttle: LoginThrottle): Promise<void> {
    this.records.set(throttle.email, { ...throttle });
  }

  async recordFailure(email: string, now: Date): Promise<LoginThrottle> {
    const current = this.records.get(email);
    const lockExpired = current?.lockedUntil != null && current.lockedUntil <= now;
    const failedCount = (current && !lockExpired ? current.failedCount : 0) + 1;
    const lockedUntil =
      failedCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCK_DURATION_MS) : null;
    const updated = { email, failedCount, lockedUntil };
    this.records.set(email, updated);
    return { ...updated };
  }

  async reset(email: string): Promise<void> {
    this.records.delete(email);
  }
}
