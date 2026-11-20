import type { Metadata } from "next";
import { PlateSearchForm } from "@/components/technician/plate-search-form";
import { TechniciansOnlyNotice } from "@/components/technician/technicians-only-notice";
import { requireUser } from "@/infrastructure/auth/current-user";
import styles from "../vehicles/vehicles-page.module.css";

export const metadata: Metadata = { title: "Find a vehicle | TwinES" };

export default async function TechnicianPage() {
  // A layout is not re-rendered on every client navigation, so the page checks the session too.
  const user = await requireUser();
  if (user.role !== "technician") return <TechniciansOnlyNotice />;

  return (
    <div className={styles.narrow}>
      <h1>Find a vehicle</h1>
      <p>Search by plate to open a vehicle&apos;s health page and record serviced parts.</p>
      <PlateSearchForm />
    </div>
  );
}
