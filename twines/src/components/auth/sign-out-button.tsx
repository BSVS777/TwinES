"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./app-shell.module.css";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setPending(true);
    setFailed(false);
    const succeeded = await fetch("/api/auth/sign-out", { method: "POST" }).then(
      (response) => response.ok,
      () => false,
    );
    if (succeeded) {
      router.push("/sign-in");
      router.refresh();
      return;
    }
    setFailed(true);
    setPending(false);
  }

  return (
    <>
      <button type="button" className={styles.signOut} onClick={signOut} disabled={pending}>
        Sign out
      </button>
      {failed && <p role="alert">Could not sign out. Please try again.</p>}
    </>
  );
}
