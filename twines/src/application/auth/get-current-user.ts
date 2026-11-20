import type { Clock, SessionStore, SessionTokens, User } from "@/application/ports";

export interface GetCurrentUserDeps {
  sessions: SessionStore;
  tokens: SessionTokens;
  clock: Clock;
}

/** Resolves the user behind a session token, or null when it is missing, unknown or expired. */
export async function getCurrentUser(
  { sessions, tokens, clock }: GetCurrentUserDeps,
  token: string | null | undefined,
): Promise<User | null> {
  if (!token) return null;
  return sessions.findUserByTokenHash(tokens.hash(token), clock.now());
}
