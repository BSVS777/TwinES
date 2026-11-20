"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { getBodyModel } from "./models";
import { STATUS_LABEL } from "./part-rows";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { VehicleVisualProps } from "./vehicle-visual";
import { VehicleScene } from "./VehicleScene";
import styles from "./Vehicle3D.module.css";

const CAMERA = { position: [5, 2.8, 5] as [number, number, number], fov: 40 };
const TARGET: [number, number, number] = [0, 0.9, 0];
/** Orbit speed for OrbitControls; 2 is a full turn in 30 seconds, so this is a slow turn. */
const AUTO_ROTATE_SPEED = 0.8;

/**
 * The rotating 3D model of the vehicle, built from primitives for its body type. Each part is a
 * colored marker with a real button over it, so the model is operable by keyboard, screen readers
 * and tests. The camera orbits slowly until a part is selected, and never when the system prefers
 * reduced motion.
 */
export function Vehicle3D({ bodyType, parts, selectedPartId, onSelect }: VehicleVisualProps) {
  const reducedMotion = usePrefersReducedMotion();
  const model = getBodyModel(bodyType);
  const autoRotate = selectedPartId === null && !reducedMotion;

  // The buttons are appended to this element for as long as the model lives. Without a fixed
  // target, drei re-targets each button once the canvas finishes connecting its events, and the
  // first button's content is lost in that hand-over. The canvas therefore waits for the element.
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const portal = useMemo(() => (stage ? { current: stage } : null), [stage]);

  return (
    <div ref={setStage} className={styles.stage} role="group" aria-label="Vehicle 3D model">
      {portal && (
        <Canvas camera={CAMERA} dpr={[1, 2]}>
          <VehicleScene model={model} parts={parts} selectedPartId={selectedPartId} onSelect={onSelect} />
          {parts.map((part) => {
            const label = `${part.name}: ${STATUS_LABEL[part.status]}`;
            return (
              <Html key={part.partId} position={[...model.hotspots[part.partId]]} center zIndexRange={[20, 0]} portal={portal}>
                <button
                  type="button"
                  className={styles.hotspot}
                  aria-label={label}
                  aria-pressed={part.partId === selectedPartId}
                  onClick={() => onSelect(part.partId)}
                />
              </Html>
            );
          })}
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={AUTO_ROTATE_SPEED}
            enablePan={false}
            minDistance={4}
            maxDistance={12}
            maxPolarAngle={Math.PI / 2 - 0.05}
            target={TARGET}
          />
        </Canvas>
      )}
    </div>
  );
}
