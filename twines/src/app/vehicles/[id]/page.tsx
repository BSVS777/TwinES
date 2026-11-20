import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotFound } from "@/application/errors";
import { getVehicleHealth } from "@/application/vehicles/get-vehicle-health";
import { buildPartRows } from "@/components/vehicle-health/part-rows";
import { VehicleHealthView } from "@/components/vehicle-health/VehicleHealthView";
import { requireUser } from "@/infrastructure/auth/current-user";
import { getContainer } from "@/infrastructure/container";
import styles from "../vehicles-page.module.css";

export const metadata: Metadata = { title: "Vehicle health | TwinES" };

export default async function VehicleHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  // Owners reach only their own vehicles and technicians any vehicle; a miss is a plain 404 (VEH-12).
  const { vehicle, health, dues, nextMaintenance, overallStatus } = await getVehicleHealth(getContainer(), user, id).catch(
    (error: unknown) => {
      if (error instanceof NotFound) notFound();
      throw error;
    },
  );

  return (
    <>
      {user.role === "owner" && (
        <div className={styles.header}>
          <Link href="/vehicles">Back to my vehicles</Link>
          <Link href={`/vehicles/${vehicle.id}/edit`} className={styles.action}>
            Edit vehicle
          </Link>
        </div>
      )}
      {/* Only serializable details cross to the client; the owner id stays on the server. */}
      <VehicleHealthView
        vehicle={{
          plate: vehicle.plate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          currentMileageKm: vehicle.currentMileageKm,
          bodyType: vehicle.bodyType,
        }}
        overallStatus={overallStatus}
        nextMaintenance={nextMaintenance}
        parts={buildPartRows(health, dues)}
        canMarkServiced={user.role === "technician"}
      />
    </>
  );
}
