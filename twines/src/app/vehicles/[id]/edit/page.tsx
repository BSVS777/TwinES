import type { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";
import { NotFound } from "@/application/errors";
import { getVehicleHealth } from "@/application/vehicles/get-vehicle-health";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { BaselineForm } from "@/components/forms/baseline-form";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";
import { MAINTENANCE_CATALOG } from "@/domain/part-health/catalog";
import { requireUser } from "@/infrastructure/auth/current-user";
import { getContainer } from "@/infrastructure/container";
import styles from "../../vehicles-page.module.css";

export const metadata: Metadata = { title: "Edit vehicle | TwinES" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "owner") forbidden();

  const { id } = await params;
  // An owner reaches only their own vehicle: someone else's looks exactly like a missing one (VEH-12).
  const { vehicle } = await getVehicleHealth(getContainer(), user, id).catch((error: unknown) => {
    if (error instanceof NotFound) notFound();
    throw error;
  });

  return (
    <>
      <div className={styles.narrow}>
        <h1>Edit {vehicle.plate}</h1>
        {/* Only the editable details cross to the client; the owner id stays on the server. */}
        <VehicleForm
          vehicle={{
            id: vehicle.id,
            plate: vehicle.plate,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            bodyType: vehicle.bodyType,
            currentMileageKm: vehicle.currentMileageKm,
            purchaseDate: vehicle.purchaseDate,
            monthlyMileageKm: vehicle.monthlyMileageKm,
          }}
        />
      </div>

      <section className={`${styles.section} ${styles.narrow}`} aria-labelledby="baselines-heading">
        <h2 id="baselines-heading">Service baselines</h2>
        <table className={styles.baselines}>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Last service</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {MAINTENANCE_CATALOG.map((part) => {
              const baseline = vehicle.baselines.find((candidate) => candidate.partId === part.id);
              return (
                <tr key={part.id}>
                  <th scope="row">{part.name}</th>
                  <td>{baseline ? `${baseline.mileageKm.toLocaleString("en-US")} km` : "Not set"}</td>
                  <td>{baseline ? baseline.date : "Not set"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <BaselineForm vehicleId={vehicle.id} />
      </section>

      <section className={`${styles.section} ${styles.narrow}`} aria-labelledby="delete-heading">
        <h2 id="delete-heading">Delete vehicle</h2>
        <DeleteVehicleButton vehicleId={vehicle.id} plate={vehicle.plate} />
      </section>
    </>
  );
}
