import type { BodyType } from "@/application/ports";
import { HATCHBACK } from "./hatchback";
import { PICKUP } from "./pickup";
import { SEDAN } from "./sedan";
import { SUV } from "./suv";
import type { BodyModel } from "./types";

const MODELS: Record<BodyType, BodyModel> = {
  sedan: SEDAN,
  hatchback: HATCHBACK,
  suv: SUV,
  pickup: PICKUP,
};

/** The generic 3D model for a vehicle's body type (VIEW-03). */
export function getBodyModel(bodyType: BodyType): BodyModel {
  return MODELS[bodyType];
}

export type { BodyModel, Box, Vec3 } from "./types";
