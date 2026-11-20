import type { BodyType } from "@/application/ports";
import type { PartId } from "@/domain/part-health/catalog";
import type { PartRow } from "./part-rows";

/**
 * What any visual of the vehicle (the 2D diagram, and the 3D model once it exists) receives. It
 * is the seam between the health view and its renderings: the visual shows one colored zone per
 * part and reports which part the user picked.
 */
export interface VehicleVisualProps {
  bodyType: BodyType;
  parts: readonly PartRow[];
  selectedPartId: PartId | null;
  onSelect: (partId: PartId) => void;
}
