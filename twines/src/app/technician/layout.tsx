import type { ReactNode } from "react";
import { AppShell } from "@/components/auth/app-shell";
import { requireUser } from "@/infrastructure/auth/current-user";

export default async function TechnicianLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <AppShell email={user.email}>{children}</AppShell>;
}
