import { toPublicUser } from "@/application/auth/public-user";
import { TooManyAttempts, Unauthorized } from "@/application/errors";
import type {
  Clock,
  LoginThrottleStore,
  PasswordHasher,
  PublicUser,
  SessionStore,
  SessionTokens,
  UserRepository,
} from "@/application/ports";
import { exceedsPasswordLimit, signInSchema } from "@/application/validation/auth";
import { parseInput } from "@/application/validation/parse";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A valid bcrypt hash (cost 12) of a random value nobody knows. Unknown emails are verified
 * against it so a missing account costs the same time as a wrong password, which keeps
 * response timing from revealing which emails are registered (AUTH-08).
 */
export const DUMMY_PASSWORD_HASH = "$2b$12$0r4mMKdpRsDXFGznSLoBCOn2KGgP8yVsw9zUjAx340Foe/I76ybAG";

const INVALID_CREDENTIALS = "Invalid email or password";

export interface SignInDeps {
  users: UserRepository;
  sessions: SessionStore;
  throttles: LoginThrottleStore;
  hasher: PasswordHasher;
  tokens: SessionTokens;
  clock: Clock;
}

export interface SignInResult {
  /** Raw session token. The caller sets it as the cookie value; only its hash is stored. */
  token: string;
  user: PublicUser;
  expiresAt: Date;
}

/**
 * Authenticates by email and password and starts a session.
 *
 * Failures are counted per normalized email, whether or not an account exists, and the fifth
 * consecutive failure locks that email for 15 minutes (AUTH-10). While locked, even the correct
 * password is refused without being checked. Once the lock has passed, the old count no longer
 * applies (AUTH-11). A password over the bcrypt limit can never be a real one, so it fails like
 * any wrong password without being hashed. Failures are recorded atomically by the store, so
 * parallel guesses cannot slip under the limit.
 */
export async function signIn(deps: SignInDeps, input: unknown): Promise<SignInResult> {
  const { users, sessions, throttles, hasher, tokens, clock } = deps;
  const { email, password } = parseInput(signInSchema, input);
  const now = clock.now();

  const throttle = await throttles.find(email);
  if (throttle?.lockedUntil && now < throttle.lockedUntil) {
    throw new TooManyAttempts(throttle.lockedUntil);
  }

  const user = await users.findByEmail(email);
  const passwordMatches =
    !exceedsPasswordLimit(password) && (await hasher.verify(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH));

  if (!user || !passwordMatches) {
    await throttles.recordFailure(email, now);
    throw new Unauthorized(INVALID_CREDENTIALS);
  }

  if (throttle) await throttles.reset(email);

  const token = tokens.generate();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await sessions.create({ tokenHash: tokens.hash(token), userId: user.id, expiresAt });
  return { token, user: toPublicUser(user), expiresAt };
}
