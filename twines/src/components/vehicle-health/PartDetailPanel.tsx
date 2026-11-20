import { MarkServicedAction } from "./MarkServicedAction";
import { StatusBadge } from "./StatusBadge";
import type { RecordServiceAction } from "./use-service-recorder";
import { describeRemainingDays, describeRemainingKm, type PartRow } from "./part-rows";
import styles from "./PartDetailPanel.module.css";

interface PartDetailPanelProps {
  /** The selected part, or null while nothing is selected. */
  part: PartRow | null;
  /** True only for technicians (VIEW-08); owners never get the service action (VIEW-09). */
  canMarkServiced: boolean;
  /** The vehicle's mileage, offered as the starting value of the service form's optional reading. */
  currentMileageKm?: number;
  /** Sends the service for the selected part and resolves to an error message, or null when saved. */
  onMarkServiced?: RecordServiceAction;
}

/** The selected part's status, usage, remaining km and days and due date. */
export function PartDetailPanel({ part, canMarkServiced, currentMileageKm, onMarkServiced }: PartDetailPanelProps) {
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
            // Keyed by part, so choosing another part starts from a closed form.
            <MarkServicedAction
              key={part.partId}
              partId={part.partId}
              currentMileageKm={currentMileageKm}
              onMarkServiced={onMarkServiced}
            />
          )}
        </>
      ) : (
        <p className={styles.empty}>Select a part to see its details.</p>
      )}
    </section>
  );
}
