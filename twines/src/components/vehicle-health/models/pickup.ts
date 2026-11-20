import type { BodyModel } from "./types";

/** Longest body with a short cabin set forward and the bed behind it. The hood spans x 1 to 2.65. */
export const PICKUP: BodyModel = {
  bodyType: "pickup",
  body: { size: [5.3, 0.8, 2], position: [0, 0.8, 0] },
  cabin: { size: [1.6, 0.7, 1.8], position: [0.2, 1.55, 0] },
  wheelRadius: 0.45,
  wheelWidth: 0.36,
  wheels: [
    [-1.7, 0.45, 1.02],
    [-1.7, 0.45, -1.02],
    [1.7, 0.45, 1.02],
    [1.7, 0.45, -1.02],
  ],
  hotspots: {
    "engine-oil": [1.35, 1.28, -0.4],
    "oil-filter": [1.35, 1.28, 0.4],
    "air-filter": [1.8, 1.28, -0.4],
    "spark-plugs": [1.8, 1.28, 0.4],
    coolant: [2.25, 1.28, -0.4],
    battery: [2.25, 1.28, 0.4],
    tires: [-1.7, 0.45, 1.24],
    "brake-pads": [1.7, 0.45, 1.24],
  },
};
