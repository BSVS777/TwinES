import type { PartDue } from "@/domain/maintenance/schedule";
import { MAINTENANCE_CATALOG, type PartId } from "@/domain/part-health/catalog";
import type { HealthStatus, PartHealth } from "@/domain/part-health/health-estimator";

/** Status written out as text, so color is never the only cue. */
export const STATUS_LABEL: Record<HealthStatus, string> = {
  green: "Green",
  yellow: "Yellow",
  orange: "Orange",
  red: "Red",
};

/**
 * Everything the health view shows about one part. Plain strings and numbers only, so the server
 * page can hand rows to client components.
 */
export interface PartRow {
  partId: PartId;
  name: string;
  status: HealthStatus;
  usagePercent: number;
  /** Negative means overdue km; null for time-based parts. */
  remainingKm: number | null;
  /** Negative means overdue days. */
  remainingDays: number;
  dueDate: string;
  overdue: boolean;
}

export function partName(partId: PartId): string {
  const part = MAINTENANCE_CATALOG.find((candidate) => candidate.id === partId);
  if (!part) throw new RangeError(`Unknown part: ${partId}`);
  return part.name;
}

/** One row per catalog part, in catalog order, joining each part's health with its due. */
export function buildPartRows(health: readonly PartHealth[], dues: readonly PartDue[]): PartRow[] {
  return MAINTENANCE_CATALOG.map((part) => {
    const partHealth = health.find((candidate) => candidate.partId === part.id);
    const due = dues.find((candidate) => candidate.partId === part.id);
    if (!partHealth || !due) throw new RangeError(`Missing health or due for part ${part.id}`);
    return {
      partId: part.id,
      name: part.name,
      status: partHealth.status,
      usagePercent: Math.round(partHealth.usageRatio * 100),
      remainingKm: partHealth.remainingKm,
      remainingDays: partHealth.remainingDays,
      dueDate: due.effectiveDueDate,
      overdue: due.overdue,
    };
  });
}

function plural(count: number, unit: string): string {
  return `${count.toLocaleString("en-US")} ${unit}${count === 1 ? "" : "s"}`;
}

/** "1,000 km left", "600 km overdue" or "Time-based" for parts tracked by time only. */
export function describeRemainingKm(remainingKm: number | null): string {
  if (remainingKm === null) return "Time-based";
  if (remainingKm < 0) return `${Math.abs(remainingKm).toLocaleString("en-US")} km overdue`;
  return `${remainingKm.toLocaleString("en-US")} km left`;
}

/** "36 days left" or "12 days overdue". */
export function describeRemainingDays(remainingDays: number): string {
  if (remainingDays < 0) return `${plural(Math.abs(remainingDays), "day")} overdue`;
  return `${plural(remainingDays, "day")} left`;
}
