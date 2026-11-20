"use client";

import { useState, type ComponentType } from "react";
import type { BodyType } from "@/application/ports";
import type { PartId } from "@/domain/part-health/catalog";
import type { HealthStatus } from "@/domain/part-health/health-estimator";
import { HealthSummary, type SummaryNextMaintenance, type SummaryVehicle } from "./HealthSummary";
import { PartDetailPanel } from "./PartDetailPanel";
import { PartList } from "./PartList";
import { VehicleDiagram2D } from "./VehicleDiagram2D";
import type { PartRow } from "./part-rows";
import type { RecordServiceAction } from "./use-service-recorder";
import { useWebGLSupport } from "./useWebGLSupport";
import type { VehicleVisualProps } from "./vehicle-visual";
import styles from "./VehicleHealthView.module.css";

interface VehicleHealthViewProps {
  vehicle: SummaryVehicle & { bodyType: BodyType };
  overallStatus: HealthStatus;
  nextMaintenance: SummaryNextMaintenance;
  parts: readonly PartRow[];
  /** True only for technicians. */
  canMarkServiced: boolean;
  /** Sends the service for the selected part and resolves to an error message, or null when saved. */
  onMarkServiced?: RecordServiceAction;
  /**
   * The seam for the 3D model: when given and WebGL is available it replaces the 2D diagram.
   * Without it, or without WebGL, the 2D diagram is always shown.
   */
  Vehicle3D?: ComponentType<VehicleVisualProps>;
}

/**
 * The vehicle page body: summary, a visual of the vehicle, the parts list and the detail panel.
 * It owns the selected part, so choosing a part in the list or on the visual updates both.
 */
export function VehicleHealthView({
  vehicle,
  overallStatus,
  nextMaintenance,
  parts,
  canMarkServiced,
  onMarkServiced,
  Vehicle3D,
}: VehicleHealthViewProps) {
  const [selectedPartId, setSelectedPartId] = useState<PartId | null>(null);
  const webgl = useWebGLSupport();
  const selectedPart = parts.find((part) => part.partId === selectedPartId) ?? null;

  const Visual: ComponentType<VehicleVisualProps> = Vehicle3D && webgl === true ? Vehicle3D : DiagramVisual;

  return (
    <div className={styles.view}>
      <HealthSummary vehicle={vehicle} overallStatus={overallStatus} nextMaintenance={nextMaintenance} />

      <div className={styles.columns}>
        <div className={styles.visual}>
          <Visual bodyType={vehicle.bodyType} parts={parts} selectedPartId={selectedPartId} onSelect={setSelectedPartId} />
          <PartDetailPanel
            part={selectedPart}
            canMarkServiced={canMarkServiced}
            currentMileageKm={vehicle.currentMileageKm}
            onMarkServiced={onMarkServiced}
          />
        </div>
        <PartList parts={parts} selectedPartId={selectedPartId} onSelect={setSelectedPartId} />
      </div>
    </div>
  );
}

/** The 2D diagram as a visual; it does not depend on the body type. */
function DiagramVisual({ parts, selectedPartId, onSelect }: VehicleVisualProps) {
  return <VehicleDiagram2D parts={parts} selectedPartId={selectedPartId} onSelect={onSelect} />;
}
