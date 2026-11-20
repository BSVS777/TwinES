import type { HealthStatus } from "@/domain/part-health/health-estimator";

/**
 * The status colors as hex values for the 3D scene, which cannot read CSS variables. They mirror
 * the `--status-*` variables in globals.css; a test keeps the two in step.
 */
export const STATUS_COLOR: Record<HealthStatus, string> = {
  green: "#2e7d32",
  yellow: "#facc15",
  orange: "#f97316",
  red: "#b91c1c",
};

export interface HotspotAppearance {
  color: string;
  /** Marker size relative to its resting size. */
  scale: number;
  /** How strongly the marker glows; the selected part glows. */
  emissiveIntensity: number;
}

/** How a part's marker looks: its status color, larger and glowing while selected. */
export function hotspotAppearance(status: HealthStatus, selected: boolean): HotspotAppearance {
  return { color: STATUS_COLOR[status], scale: selected ? 1.6 : 1, emissiveIntensity: selected ? 0.9 : 0.15 };
}
