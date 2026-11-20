import type { HealthStatus } from "@/domain/part-health/health-estimator";
import type { PartId } from "@/domain/part-health/catalog";
import { StatusBadge } from "./StatusBadge";
import { partName } from "./part-rows";
import styles from "./HealthSummary.module.css";

export interface SummaryVehicle {
  plate: string;
  make: string;
  model: string;
  year: number;
  currentMileageKm: number;
}

export interface SummaryNextMaintenance {
  date: string;
  overdue: boolean;
  parts: readonly PartId[];
  estimatedMileageKm: number;
}

interface HealthSummaryProps {
  vehicle: SummaryVehicle;
  overallStatus: HealthStatus;
  nextMaintenance: SummaryNextMaintenance;
}

/** The vehicle's details, overall status and next recommended maintenance (VIEW-01). */
export function HealthSummary({ vehicle, overallStatus, nextMaintenance }: HealthSummaryProps) {
  return (
    <section className={styles.summary} aria-labelledby="summary-heading">
      <h1 id="summary-heading" className={styles.plate}>
        {vehicle.plate}
      </h1>
      <p className={styles.vehicle}>
        {vehicle.make} {vehicle.model} {vehicle.year}
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>Current mileage</dt>
          <dd>{vehicle.currentMileageKm.toLocaleString("en-US")} km</dd>
        </div>
        <div>
          <dt>Overall status</dt>
          <dd>
            <StatusBadge status={overallStatus} />
          </dd>
        </div>
      </dl>

      <h2 className={styles.next}>Next maintenance</h2>
      <dl className={styles.facts}>
        <div>
          <dt>Date</dt>
          <dd>
            {nextMaintenance.date}
            {nextMaintenance.overdue && <strong className={styles.overdue}>Overdue</strong>}
          </dd>
        </div>
        <div>
          <dt>Estimated mileage</dt>
          <dd>{nextMaintenance.estimatedMileageKm.toLocaleString("en-US")} km</dd>
        </div>
        <div>
          <dt>Parts</dt>
          <dd>{nextMaintenance.parts.map(partName).join(", ")}</dd>
        </div>
      </dl>

      <p className={styles.notice}>Maintenance intervals are generic estimates, not manufacturer data.</p>
    </section>
  );
}
