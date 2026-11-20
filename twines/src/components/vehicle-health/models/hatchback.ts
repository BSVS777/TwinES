import type { BodyModel } from "./types";

/** Short body with a tall, long cabin that runs to the tail. The hood spans x 0.9 to 1.95. */
export const HATCHBACK: BodyModel = {
  bodyType: "hatchback",
  body: { size: [3.9, 0.7, 1.76], position: [0, 0.65, 0] },
  cabin: { size: [2.4, 0.65, 1.6], position: [-0.3, 1.325, 0] },
  wheelRadius: 0.35,
  wheelWidth: 0.3,
  wheels: [
    [-1.2, 0.35, 0.88],
    [-1.2, 0.35, -0.88],
    [1.2, 0.35, 0.88],
    [1.2, 0.35, -0.88],
  ],
  hotspots: {
    "engine-oil": [1.15, 1.08, -0.35],
    "oil-filter": [1.15, 1.08, 0.35],
    "air-filter": [1.45, 1.08, -0.35],
    "spark-plugs": [1.45, 1.08, 0.35],
    coolant: [1.75, 1.08, -0.35],
    battery: [1.75, 1.08, 0.35],
    tires: [-1.2, 0.35, 1.1],
    "brake-pads": [1.2, 0.35, 1.1],
  },
};
