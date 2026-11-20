import type { PublicUser, User } from "@/application/ports";

/** Copies only the public fields, so a new `User` column can never leak by accident. */
export function toPublicUser({ id, email, role }: User): PublicUser {
  return { id, email, role };
}
