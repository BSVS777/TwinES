import Link from "next/link";
import styles from "./vehicle-list.module.css";

/** The few details the list shows for each vehicle. */
export interface VehicleListItem {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  currentMileageKm: number;
}

interface VehicleListProps {
  vehicles: readonly VehicleListItem[];
}

/** The owner's vehicles, or the empty state with its way forward (VEH-08, VEH-11). */
export function VehicleList({ vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <div className={styles.empty}>
        <p>You have no vehicles yet</p>
        <Link href="/vehicles/new" className={styles.action}>
          Register vehicle
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {vehicles.map((vehicle) => (
        <li key={vehicle.id} className={styles.item}>
          <Link href={`/vehicles/${vehicle.id}`} className={styles.details}>
            <span className={styles.plate}>{vehicle.plate}</span>
            <span>
              {vehicle.make} {vehicle.model} {vehicle.year}
            </span>
            <span className={styles.mileage}>{vehicle.currentMileageKm.toLocaleString("en-US")} km</span>
          </Link>
          <Link href={`/vehicles/${vehicle.id}/edit`} aria-label={`Edit ${vehicle.plate}`} className={styles.edit}>
            Edit
          </Link>
        </li>
      ))}
    </ul>
  );
}
