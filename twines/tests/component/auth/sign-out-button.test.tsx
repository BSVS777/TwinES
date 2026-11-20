import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "@/components/auth/sign-out-button";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SignOutButton", () => {
  it("AUTH-12 posts to the sign-out endpoint and returns to the sign-in page", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/sign-in"));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/sign-out", { method: "POST" });
  });

  it("stays put and re-enables the button when the request fails", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ error: "Internal server error" }, { status: 500 }));
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not sign out. Please try again.");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });
});
