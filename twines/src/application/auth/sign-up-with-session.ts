import { signUp, type SignUpDeps } from "@/application/auth/sign-up";
import { startSession, type SessionResult, type StartSessionDeps } from "@/application/auth/start-session";
import type { LoginThrottleStore } from "@/application/ports";

export interface SignUpWithSessionDeps extends SignUpDeps, StartSessionDeps {
  throttles: LoginThrottleStore;
}

/**
 * Creates an owner account and signs them in (AUTH-01). A brand-new account has no legitimate
 * failed attempts, so any throttle left by guesses against the email before it existed is
 * cleared and the session starts directly. Going through `signIn` instead would refuse the
 * visitor with 429 right after the account was created.
 */
export async function signUpWithSession(deps: SignUpWithSessionDeps, input: unknown): Promise<SessionResult> {
  const user = await signUp(deps, input);
  await deps.throttles.reset(user.email);
  return startSession(deps, user);
}
