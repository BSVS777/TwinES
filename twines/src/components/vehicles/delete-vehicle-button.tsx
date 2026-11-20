"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./delete-vehicle-button.module.css";

interface DeleteVehicleButtonProps {
  vehicleId: string;
  /** Named in the confirmation so the owner sees which vehicle is about to go. */
  plate: string;
}

/**
 * Two-step delete (VEH-10): the first click only asks, and nothing is sent until the owner
 * confirms. An in-page step is used instead of `window.confirm` so it is styled, testable and
 * reachable by keyboard and screen readers like the rest of the page.
 */
export function DeleteVehicleButton({ vehicleId, plate }: DeleteVehicleButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setPending(true);
    setFailed(false);
    const deleted = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" }).then(
      (response) => response.ok,
      () => false,
    );
    if (deleted) {
      router.push("/vehicles");
      router.refresh();
      return;
    }
    setFailed(true);
    setConfirming(false);
    setPending(false);
  }

  return (
    <div className={styles.container}>
      {failed && (
        <p role="alert" className={styles.error}>
          Could not delete the vehicle. Please try again.
        </p>
      )}
      {confirming ? (
        <div role="group" aria-label="Confirm deletion" className={styles.confirm}>
          <p>Delete {plate} and its service baselines? This cannot be undone.</p>
          <div className={styles.choices}>
            <button type="button" className={styles.danger} onClick={remove} disabled={pending}>
              {pending ? "Deleting..." : "Yes, delete vehicle"}
            </button>
            <button type="button" className={styles.cancel} onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
          Delete vehicle
        </button>
      )}
    </div>
  );
}
