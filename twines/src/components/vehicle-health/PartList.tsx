import type { PartId } from "@/domain/part-health/catalog";
import { StatusBadge } from "./StatusBadge";
import { describeRemainingDays, describeRemainingKm, type PartRow } from "./part-rows";
import styles from "./PartList.module.css";

interface PartListProps {
  parts: readonly PartRow[];
  selectedPartId: PartId | null;
  onSelect: (partId: PartId) => void;
}

/**
 * All tracked parts as an accessible list: the source of truth for assistive technology and
 * automated tests. Choosing an item selects the part; the selection is shared with the diagram.
 */
export function PartList({ parts, selectedPartId, onSelect }: PartListProps) {
  return (
    <ul className={styles.list} aria-label="Vehicle parts">
      {parts.map((part) => {
        const selected = part.partId === selectedPartId;
        return (
          <li key={part.partId} className={styles.item} data-selected={selected}>
            <div className={styles.heading}>
              <button
                type="button"
                className={styles.select}
                aria-pressed={selected}
                onClick={() => onSelect(part.partId)}
              >
                {part.name}
              </button>
              <StatusBadge status={part.status} />
              {part.overdue && <strong className={styles.overdue}>Overdue</strong>}
            </div>
            <p className={styles.meta}>
              <span>{part.usagePercent}% used</span>
              <span>{describeRemainingKm(part.remainingKm)}</span>
              <span>{describeRemainingDays(part.remainingDays)}</span>
              <span>Due {part.dueDate}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
