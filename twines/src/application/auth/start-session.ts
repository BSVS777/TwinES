import type { Clock, PublicUser, SessionStore, SessionTokens } from "@/application/ports";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface StartSessionDeps {
  sessions: SessionStore;
  tokens: SessionTokens;
  clock: Clock;
}

export interface SessionResult {
  /** Raw session token. The caller sets it as the cookie value; only its hash is stored. */
  token: string;
  user: PublicUser;
  expiresAt: Date;
}

/**
 * Starts a session for a user whose identity was already established, by a verified password
 * or by having just created the account. It performs no credential or throttle checks.
 */
export async function startSession(
  { sessions, tokens, clock }: StartSessionDeps,
  user: PublicUser,
): Promise<SessionResult> {
  const token = tokens.generate();
  const expiresAt = new Date(clock.now().getTime() + SESSION_TTL_MS);
  await sessions.create({ tokenHash: tokens.hash(token), userId: user.id, expiresAt });
  return { token, user, expiresAt };
}
