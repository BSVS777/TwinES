import { z } from "zod";

const MAX_PASSWORD_BYTES = 72; // bcrypt ignores everything past 72 bytes.
const utf8 = new TextEncoder();

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

const newPassword = z
  .string({ error: "Password is required" })
  .refine((value) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value), {
    error: "Password must have at least 8 characters, including a letter and a digit",
  })
  .refine((value) => utf8.encode(value).length <= MAX_PASSWORD_BYTES, {
    error: `Password must be at most ${MAX_PASSWORD_BYTES} bytes long`,
  });

/** Sign-up input. Unknown keys such as `role` are dropped, so they can never reach a use case. */
export const signUpSchema = z.object({ email, password: newPassword }, { error: "Invalid input" });

export const signInSchema = z.object(
  {
    email,
    password: z.string({ error: "Password is required" }).min(1, "Password is required"),
  },
  { error: "Invalid input" },
);

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
