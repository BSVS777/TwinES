import { toPublicUser } from "@/application/auth/public-user";
import type { Clock, PublicUser, SessionStore, SessionTokens } from "@/application/ports";

export interface GetCurrentUserDeps {
  sessions: SessionStore;
  tokens: SessionTokens;
  clock: Clock;
}

/** Resolves the user behind a session token, or null when it is missing, unknown or expired. */
export async function getCurrentUser(
  { sessions, tokens, clock }: GetCurrentUserDeps,
  token: string | null | undefined,
): Promise<PublicUser | null> {
  if (!token) return null;
  const user = await sessions.findUserByTokenHash(tokens.hash(token), clock.now());
  return user ? toPublicUser(user) : null;
}
