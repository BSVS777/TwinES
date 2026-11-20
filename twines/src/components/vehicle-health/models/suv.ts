import type { BodyModel } from "./types";

/** Tall, wide body on bigger wheels with a boxy cabin. The hood spans x 0.95 to 2.35. */
export const SUV: BodyModel = {
  bodyType: "suv",
  body: { size: [4.7, 0.9, 1.95], position: [0, 0.85, 0] },
  cabin: { size: [2.9, 0.75, 1.8], position: [-0.5, 1.675, 0] },
  wheelRadius: 0.42,
  wheelWidth: 0.34,
  wheels: [
    [-1.45, 0.42, 1],
    [-1.45, 0.42, -1],
    [1.45, 0.42, 1],
    [1.45, 0.42, -1],
  ],
  hotspots: {
    "engine-oil": [1.25, 1.38, -0.4],
    "oil-filter": [1.25, 1.38, 0.4],
    "air-filter": [1.65, 1.38, -0.4],
    "spark-plugs": [1.65, 1.38, 0.4],
    coolant: [2.05, 1.38, -0.4],
    battery: [2.05, 1.38, 0.4],
    tires: [-1.45, 0.42, 1.22],
    "brake-pads": [1.45, 0.42, 1.22],
  },
};
