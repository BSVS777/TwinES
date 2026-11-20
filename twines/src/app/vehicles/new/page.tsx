import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { requireUser } from "@/infrastructure/auth/current-user";
import styles from "../vehicles-page.module.css";

export const metadata: Metadata = { title: "Register vehicle | TwinES" };

export default async function NewVehiclePage() {
  const user = await requireUser();
  if (user.role !== "owner") forbidden();

  return (
    <div className={styles.narrow}>
      <h1>Register vehicle</h1>
      <VehicleForm />
    </div>
  );
}
