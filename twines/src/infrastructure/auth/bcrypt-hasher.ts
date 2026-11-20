import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "@/application/ports";

export const DEFAULT_BCRYPT_COST = 12;

/** bcrypt hasher (pure JavaScript, no native build). The cost can be lowered to speed up tests. */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cost: number = DEFAULT_BCRYPT_COST) {}

  hash(plain: string): Promise<string> {
    return hash(plain, this.cost);
  }

  verify(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
