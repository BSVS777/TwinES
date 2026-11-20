import type { HealthStatus } from "@/domain/part-health/health-estimator";
import { STATUS_LABEL } from "./part-rows";
import styles from "./StatusBadge.module.css";

/** A status as text with a color swatch beside it; the swatch is decoration only. */
export function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span className={styles.badge}>
      <span className={styles.swatch} data-status={status} aria-hidden="true" />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}
