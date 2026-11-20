import { requireUser } from "@/infrastructure/auth/current-user";

export default async function VehiclesPage() {
  // A layout is not re-rendered on every client navigation, so the page checks the session too.
  await requireUser();
  return <h1>Your vehicles</h1>;
}
