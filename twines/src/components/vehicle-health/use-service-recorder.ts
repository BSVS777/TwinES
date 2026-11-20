"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { submitJson } from "@/components/forms/submit-json";
import type { PartId } from "@/domain/part-health/catalog";

/** Sends a serviced part to the server; resolves to an error message, or null when it was saved. */
export type RecordServiceAction = (partId: PartId, currentMileageKm?: number) => Promise<string | null>;

/**
 * The technician's "mark as serviced" request for one vehicle (VEH-16). On success it refreshes
 * the page's server data, so the part's status and the next maintenance are recomputed and shown.
 */
export function useServiceRecorder(vehicleId: string): RecordServiceAction {
  const router = useRouter();

  return useCallback(
    async (partId, currentMileageKm) => {
      const body = currentMileageKm === undefined ? { partId } : { partId, currentMileageKm };
      const result = await submitJson(`/api/technician/vehicles/${encodeURIComponent(vehicleId)}/service`, body);
      if (!result.ok) return Object.values(result.errors)[0] ?? "Something went wrong. Please try again.";
      router.refresh();
      return null;
    },
    [router, vehicleId],
  );
}
