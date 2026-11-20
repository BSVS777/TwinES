import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteVehicleButton } from "@/components/vehicles/delete-vehicle-button";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function stubFetch(response: Response | Promise<Response> | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DeleteVehicleButton", () => {
  it("VEH-10 asks for confirmation before anything is deleted", () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));
    render(<DeleteVehicleButton vehicleId="v1" plate="ABC-123" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete vehicle" }));

    expect(screen.getByText(/ABC-123/)).toHaveTextContent("Delete ABC-123 and its service baselines? This cannot be undone.");
    expect(screen.getByRole("button", { name: "Yes, delete vehicle" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("goes back to the single button when the owner cancels, without deleting", () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));
    render(<DeleteVehicleButton vehicleId="v1" plate="ABC-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete vehicle" }));

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Delete vehicle" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes, delete vehicle" })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("VEH-10 deletes the vehicle once confirmed and returns to the list", async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }));
    render(<DeleteVehicleButton vehicleId="v1" plate="ABC-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete vehicle" }));

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete vehicle" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/vehicles/v1", { method: "DELETE" });
  });

  it("disables both choices while the request is in flight", async () => {
    let finish: (response: Response) => void = () => {};
    stubFetch(new Promise<Response>((resolve) => (finish = resolve)));
    render(<DeleteVehicleButton vehicleId="v1" plate="ABC-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete vehicle" }));

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete vehicle" }));

    expect(await screen.findByRole("button", { name: "Deleting..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    finish(new Response(null, { status: 204 }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
  });

  it("tells the owner when the deletion failed and offers the button again", async () => {
    stubFetch(Response.json({ error: "Vehicle not found" }, { status: 404 }));
    render(<DeleteVehicleButton vehicleId="v1" plate="ABC-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete vehicle" }));

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete vehicle" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete the vehicle. Please try again.");
    expect(screen.getByRole("button", { name: "Delete vehicle" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("reports a request that never arrived the same way", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    render(<DeleteVehicleButton vehicleId="v1" plate="ABC-123" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete vehicle" }));

    fireEvent.click(screen.getByRole("button", { name: "Yes, delete vehicle" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
