"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { VehicleHealthView } from "./VehicleHealthView";
import styles from "./Vehicle3D.module.css";

// The model needs the browser (WebGL), so its code is fetched on the client only, and only when
// the view decides to show it. Until then, and without WebGL, the 2D diagram is what people see.
const LazyVehicle3D = dynamic(() => import("./Vehicle3D").then((module) => module.Vehicle3D), {
  ssr: false,
  loading: () => (
    <p className={styles.loading} role="status">
      Loading 3D model...
    </p>
  ),
});

type VehicleHealthWithModelProps = Omit<ComponentProps<typeof VehicleHealthView>, "Vehicle3D">;

/**
 * The vehicle page body with the 3D model wired in. The server page renders this, because a
 * component cannot be passed from a server component to a client one as a prop.
 */
export function VehicleHealthWithModel(props: VehicleHealthWithModelProps) {
  return <VehicleHealthView {...props} Vehicle3D={LazyVehicle3D} />;
}
