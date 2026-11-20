import type { BodyModel } from "./types";

/** Long, low body with a three-box profile. The hood spans x 0.75 to 2.3. */
export const SEDAN: BodyModel = {
  bodyType: "sedan",
  body: { size: [4.6, 0.7, 1.8], position: [0, 0.65, 0] },
  cabin: { size: [2.1, 0.6, 1.6], position: [-0.3, 1.3, 0] },
  wheelRadius: 0.35,
  wheelWidth: 0.3,
  wheels: [
    [-1.4, 0.35, 0.9],
    [-1.4, 0.35, -0.9],
    [1.4, 0.35, 0.9],
    [1.4, 0.35, -0.9],
  ],
  hotspots: {
    "engine-oil": [1.2, 1.08, -0.35],
    "oil-filter": [1.2, 1.08, 0.35],
    "air-filter": [1.65, 1.08, -0.35],
    "spark-plugs": [1.65, 1.08, 0.35],
    coolant: [2.05, 1.08, -0.35],
    battery: [2.05, 1.08, 0.35],
    tires: [-1.4, 0.35, 1.12],
    "brake-pads": [1.4, 0.35, 1.12],
  },
};
