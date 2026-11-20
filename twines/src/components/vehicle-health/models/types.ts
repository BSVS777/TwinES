import type { BodyType } from "@/application/ports";
import type { PartId } from "@/domain/part-health/catalog";

/** [x, y, z] in scene units (about one meter): x runs along the vehicle with the front at +x, y is up. */
export type Vec3 = readonly [number, number, number];

/** An axis-aligned box centered on `position`. */
export interface Box {
  size: Vec3;
  position: Vec3;
}

/** The shape of one generic vehicle: pure data that Vehicle3D turns into primitives. */
export interface BodyModel {
  bodyType: BodyType;
  /** The lower body, from bumper to bumper. */
  body: Box;
  /** The glass house sitting on the body. */
  cabin: Box;
  wheelRadius: number;
  /** Wheel width, along z. */
  wheelWidth: number;
  /** Wheel centers: two rear (negative x) and two front (positive x). */
  wheels: readonly Vec3[];
  /** Where each part's colored marker sits. */
  hotspots: Readonly<Record<PartId, Vec3>>;
}
