"use client";

import Link from "next/link";
import { FormField } from "@/components/forms/form-field";
import { useJsonForm } from "@/components/forms/use-json-form";
import styles from "./auth-form.module.css";

export function SignInForm() {
  const { errors, pending, onSubmit } = useJsonForm("/api/auth/sign-in", "/vehicles");

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
        autoComplete="current-password"
        error={errors.password}
      />
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className={styles.alternative}>
        New to TwinES? <Link href="/sign-up">Create an account</Link>
      </p>
    </form>
  );
}
