"use client";

import { hotspotAppearance } from "./status-colors";
import type { BodyModel } from "./models";
import type { PartRow } from "./part-rows";
import type { PartId } from "@/domain/part-health/catalog";

interface VehicleSceneProps {
  model: BodyModel;
  parts: readonly PartRow[];
  selectedPartId: PartId | null;
  onSelect: (partId: PartId) => void;
}

const BODY_COLOR = "#9ca3af";
const CABIN_COLOR = "#cbd5e1";
const WHEEL_COLOR = "#1f2937";
const GROUND_COLOR = "#e5e7eb";
const HOTSPOT_RADIUS = 0.11;

/**
 * Everything drawn inside the canvas: lights, a ground disc, the vehicle built from boxes and
 * cylinders, and one colored sphere per part. The buttons that make the spheres reachable by
 * keyboard are added by Vehicle3D, so this file is pure rendering.
 */
export function VehicleScene({ model, parts, selectedPartId, onSelect }: VehicleSceneProps) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 4]} intensity={1.5} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial color={GROUND_COLOR} />
      </mesh>

      <mesh position={[...model.body.position]}>
        <boxGeometry args={[...model.body.size]} />
        <meshStandardMaterial color={BODY_COLOR} />
      </mesh>
      <mesh position={[...model.cabin.position]}>
        <boxGeometry args={[...model.cabin.size]} />
        <meshStandardMaterial color={CABIN_COLOR} />
      </mesh>

      {model.wheels.map((wheel) => (
        <mesh key={wheel.join(",")} position={[...wheel]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[model.wheelRadius, model.wheelRadius, model.wheelWidth, 24]} />
          <meshStandardMaterial color={WHEEL_COLOR} />
        </mesh>
      ))}

      {parts.map((part) => {
        const look = hotspotAppearance(part.status, part.partId === selectedPartId);
        return (
          <mesh
            key={part.partId}
            position={[...model.hotspots[part.partId]]}
            scale={look.scale}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(part.partId);
            }}
          >
            <sphereGeometry args={[HOTSPOT_RADIUS, 24, 16]} />
            <meshStandardMaterial color={look.color} emissive={look.color} emissiveIntensity={look.emissiveIntensity} />
          </mesh>
        );
      })}
    </>
  );
}
