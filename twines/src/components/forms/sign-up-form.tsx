"use client";

import Link from "next/link";
import { FormField } from "@/components/forms/form-field";
import { useJsonForm } from "@/components/forms/use-json-form";
import styles from "./auth-form.module.css";

export function SignUpForm() {
  const { errors, pending, onSubmit } = useJsonForm("/api/auth/sign-up", "/vehicles");

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {errors.form && (
        <p role="alert" className={styles.formError}>
          {errors.form}
        </p>
      )}
      <FormField name="email" label="Email" type="email" autoComplete="email" error={errors.email} />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, including a letter and a digit."
        error={errors.password}
      />
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </button>
      <p className={styles.alternative}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
