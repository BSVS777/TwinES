import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/application/auth/get-current-user";
import type { PublicUser } from "@/application/ports";
import { SESSION_COOKIE } from "@/infrastructure/auth/session-cookie";
import { getContainer } from "@/infrastructure/container";

/** The signed-in user for the current request, or null. Memoized so a layout and its page share one lookup. */
export const getSessionUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getCurrentUser(getContainer(), token);
});

/**
 * The real session check for server components. The proxy only sees whether a cookie exists;
 * this rejects a forged, expired or signed-out cookie by sending the visitor to sign in.
 */
export async function requireUser(): Promise<PublicUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}
