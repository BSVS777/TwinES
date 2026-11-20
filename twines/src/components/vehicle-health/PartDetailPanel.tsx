import type { PartId } from "@/domain/part-health/catalog";
import { StatusBadge } from "./StatusBadge";
import { describeRemainingDays, describeRemainingKm, type PartRow } from "./part-rows";
import styles from "./PartDetailPanel.module.css";

interface PartDetailPanelProps {
  /** The selected part, or null while nothing is selected. */
  part: PartRow | null;
  /** True only for technicians (VIEW-08); owners never get the service action (VIEW-09). */
  canMarkServiced: boolean;
  /** Called with the selected part when the action is used; the service flow is wired separately. */
  onMarkServiced?: (partId: PartId) => void;
}

/** The selected part's status, usage, remaining km and days and due date. */
export function PartDetailPanel({ part, canMarkServiced, onMarkServiced }: PartDetailPanelProps) {
  return (
    <section className={styles.panel} aria-label="Part details" aria-live="polite">
      {part ? (
        <>
          <h2 className={styles.name}>{part.name}</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={part.status} />
                {part.overdue && <strong className={styles.overdue}>Overdue</strong>}
              </dd>
            </div>
            <div>
              <dt>Usage</dt>
              <dd>{part.usagePercent}%</dd>
            </div>
            <div>
              <dt>Remaining distance</dt>
              <dd>{describeRemainingKm(part.remainingKm)}</dd>
            </div>
            <div>
              <dt>Remaining time</dt>
              <dd>{describeRemainingDays(part.remainingDays)}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{part.dueDate}</dd>
            </div>
          </dl>
          {canMarkServiced && (
            <button type="button" className={styles.action} onClick={() => onMarkServiced?.(part.partId)}>
              Mark as serviced
            </button>
          )}
        </>
      ) : (
        <p className={styles.empty}>Select a part to see its details.</p>
      )}
    </section>
  );
}
