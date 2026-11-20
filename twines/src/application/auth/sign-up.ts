import { Conflict } from "@/application/errors";
import type { PasswordHasher, User, UserRepository } from "@/application/ports";
import { signUpSchema } from "@/application/validation/auth";
import { parseInput } from "@/application/validation/parse";

export interface SignUpDeps {
  users: UserRepository;
  hasher: PasswordHasher;
}

const DUPLICATE_EMAIL = "An account with this email already exists";

/**
 * Creates an owner account. The role is fixed here, never read from the input, so public
 * sign-up cannot produce technicians (AUTH-06).
 */
export async function signUp({ users, hasher }: SignUpDeps, input: unknown): Promise<User> {
  const { email, password } = parseInput(signUpSchema, input);

  if (await users.findByEmail(email)) {
    throw new Conflict(DUPLICATE_EMAIL, "email");
  }

  try {
    return await users.create({ email, passwordHash: await hasher.hash(password), role: "owner" });
  } catch (error) {
    // A concurrent sign-up can win the race between the lookup and the insert.
    if (error instanceof Conflict) throw new Conflict(DUPLICATE_EMAIL, "email");
    throw error;
  }
}
