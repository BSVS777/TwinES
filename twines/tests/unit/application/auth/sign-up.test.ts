import { beforeEach, describe, expect, it } from "vitest";
import { Conflict, ValidationError } from "@/application/errors";
import { signUp, type SignUpDeps } from "@/application/auth/sign-up";
import { FakePasswordHasher, InMemoryUserRepository } from "./fakes";

describe("signUp", () => {
  let users: InMemoryUserRepository;
  let deps: SignUpDeps;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    deps = { users, hasher: new FakePasswordHasher() };
  });

  async function validationErrors(input: unknown): Promise<Record<string, string>> {
    const error = await signUp(deps, input).then(
      () => null,
      (thrown: unknown) => thrown,
    );
    expect(error).toBeInstanceOf(ValidationError);
    return (error as ValidationError).errors;
  }

  it("AUTH-01 creates an owner account with a lowercase, trimmed email", async () => {
    const user = await signUp(deps, { email: "  Ana@Example.com ", password: "secret123" });

    expect(user.email).toBe("ana@example.com");
    expect(user.role).toBe("owner");
    expect(users.users).toHaveLength(1);
    expect(await users.findByEmail("ana@example.com")).toMatchObject({ id: user.id, email: user.email });
  });

  it("returns only the public fields, never the password hash", async () => {
    const user = await signUp(deps, { email: "ana@example.com", password: "secret123" });

    expect(user).toEqual({ id: "user-1", email: "ana@example.com", role: "owner" });
    expect(user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(user)).not.toContain("hashed(");
  });

  it("AUTH-02 rejects a duplicate email regardless of letter case", async () => {
    await signUp(deps, { email: "ana@example.com", password: "secret123" });

    const attempt = signUp(deps, { email: "ANA@example.com", password: "other1234" });

    await expect(attempt).rejects.toThrow(
      new Conflict("An account with this email already exists", "email"),
    );
    await expect(attempt).rejects.toMatchObject({ field: "email" });
    expect(users.users).toHaveLength(1);
  });

  it("AUTH-02 reports a duplicate email lost to a concurrent sign-up with the same message", async () => {
    const racing = new InMemoryUserRepository();
    await racing.create({ email: "ana@example.com", passwordHash: "x", role: "owner" });
    racing.findByEmail = async () => null;

    await expect(
      signUp({ users: racing, hasher: deps.hasher }, { email: "ana@example.com", password: "secret123" }),
    ).rejects.toThrow("An account with this email already exists");
  });

  it("lets unexpected storage failures through instead of reporting them as duplicates", async () => {
    users.create = async () => {
      throw new Error("database unavailable");
    };

    await expect(signUp(deps, { email: "ana@example.com", password: "secret123" })).rejects.toThrow(
      "database unavailable",
    );
  });

  it("AUTH-03 rejects a password without a digit and explains the rule", async () => {
    const errors = await validationErrors({ email: "ana@example.com", password: "abcdefg" });

    expect(errors).toEqual({
      password: "Password must have at least 8 characters, including a letter and a digit",
    });
    expect(users.users).toHaveLength(0);
  });

  it.each([
    ["too short", "abc12"],
    ["no digit", "abcdefgh"],
    ["no letter", "12345678"],
    ["empty", ""],
  ])("AUTH-03 rejects a password that is %s", async (_label, password) => {
    const errors = await validationErrors({ email: "ana@example.com", password });

    expect(Object.keys(errors)).toEqual(["password"]);
  });

  it("AUTH-03 accepts a password that is exactly 8 characters with a letter and a digit", async () => {
    await expect(signUp(deps, { email: "ana@example.com", password: "abcdefg1" })).resolves.toBeDefined();
  });

  it("rejects a password longer than bcrypt can hash without truncating", async () => {
    const errors = await validationErrors({ email: "ana@example.com", password: `a1${"x".repeat(71)}` });

    expect(errors).toEqual({ password: "Password must be at most 72 bytes long" });
  });

  it("AUTH-04 rejects an invalid email", async () => {
    const errors = await validationErrors({ email: "ana@", password: "secret123" });

    expect(errors).toEqual({ email: "Enter a valid email address" });
    expect(users.users).toHaveLength(0);
  });

  it("reports every invalid field at once", async () => {
    const errors = await validationErrors({ email: "nope", password: "short" });

    expect(Object.keys(errors).sort()).toEqual(["email", "password"]);
  });

  it("rejects missing or non-object input as a form-level error", async () => {
    expect(await validationErrors(undefined)).toEqual({ form: "Invalid input" });
    expect(await validationErrors({ email: 42 })).toMatchObject({ email: "Email is required" });
  });

  it("AUTH-05 stores the hash from the password hasher and never the plain password", async () => {
    await signUp(deps, { email: "ana@example.com", password: "secret123" });

    const [stored] = users.users;
    expect(stored.passwordHash).toBe("hashed(secret123)");
    expect(stored.passwordHash).not.toBe("secret123");
    expect(JSON.stringify(stored)).not.toContain('"secret123"');
  });

  it("AUTH-06 ignores a role supplied in the input", async () => {
    const user = await signUp(deps, {
      email: "tech@example.com",
      password: "secret123",
      role: "technician",
    });

    expect(user.role).toBe("owner");
    expect(users.users[0].role).toBe("owner");
  });
});
