import type { SessionStore, SessionTokens } from "@/application/ports";

export interface SignOutDeps {
  sessions: SessionStore;
  tokens: SessionTokens;
}

/** Ends the session behind a token. A missing or unknown token is not an error. */
export async function signOut({ sessions, tokens }: SignOutDeps, token: string | null | undefined): Promise<void> {
  if (!token) return;
  await sessions.deleteByTokenHash(tokens.hash(token));
}
