import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import styles from "./app-shell.module.css";

interface AppShellProps {
  email: string;
  children: ReactNode;
}

/** Frame for every signed-in page: brand link, who is signed in, and the sign-out button. */
export function AppShell({ email, children }: AppShellProps) {
  return (
    <>
      <header className={styles.header}>
        <Link href="/vehicles" className={styles.brand}>
          TwinES
        </Link>
        <div className={styles.account}>
          <span className={styles.email}>{email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </>
  );
}
