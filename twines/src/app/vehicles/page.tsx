import type { Metadata } from "next";
import Link from "next/link";
import { OwnersOnlyNotice } from "@/components/vehicles/owners-only-notice";
import { VehicleList } from "@/components/vehicles/vehicle-list";
import { listVehicles } from "@/application/vehicles/list-vehicles";
import { requireUser } from "@/infrastructure/auth/current-user";
import { getContainer } from "@/infrastructure/container";
import styles from "./vehicles-page.module.css";

export const metadata: Metadata = { title: "Your vehicles | TwinES" };

export default async function VehiclesPage() {
  // A layout is not re-rendered on every client navigation, so the page checks the session too.
  const user = await requireUser();
  if (user.role !== "owner") return <OwnersOnlyNotice />;

  const vehicles = await listVehicles(getContainer(), user);
  return (
    <>
      <div className={styles.header}>
        <h1>Your vehicles</h1>
        {vehicles.length > 0 && (
          <Link href="/vehicles/new" className={styles.action}>
            Register vehicle
          </Link>
        )}
      </div>
      <VehicleList vehicles={vehicles} />
    </>
  );
}
