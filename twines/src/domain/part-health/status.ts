import type { HealthStatus } from "./health-estimator";

const YELLOW_FROM = 0.5;
const ORANGE_FROM = 0.75;
const RED_FROM = 1;

/** Maps a usage ratio to a status; each lower bound is inclusive. */
export function statusForRatio(ratio: number): HealthStatus {
  if (ratio >= RED_FROM) return "red";
  if (ratio >= ORANGE_FROM) return "orange";
  if (ratio >= YELLOW_FROM) return "yellow";
  return "green";
}

const SEVERITY: Record<HealthStatus, number> = { green: 0, yellow: 1, orange: 2, red: 3 };

/** The worst status in the list (red > orange > yellow > green); green when empty. */
export function worstStatus(statuses: readonly HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>(
    (worst, status) => (SEVERITY[status] > SEVERITY[worst] ? status : worst),
    "green",
  );
}
