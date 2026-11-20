import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlateSearchForm } from "@/components/technician/plate-search-form";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function search(plate: string) {
  fireEvent.change(screen.getByLabelText("Plate"), { target: { value: plate } });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
}

beforeEach(() => {
  router.push.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PlateSearchForm", () => {
  it("has a labelled plate field and a search button", () => {
    render(<PlateSearchForm />);

    expect(screen.getByLabelText("Plate")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  });

  it("VEH-14 searches the typed plate and opens the vehicle's health page", async () => {
    const fetchMock = stubFetch(Response.json({ id: "vehicle-7", plate: "ABC-123" }));
    render(<PlateSearchForm />);

    search("abc-123");

    await waitFor(() => expect(router.push).toHaveBeenCalledExactlyOnceWith("/vehicles/vehicle-7"));
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/technician/vehicles?plate=abc-123");
  });

  it("encodes the plate in the query string", async () => {
    const fetchMock = stubFetch(Response.json({ id: "v", plate: "A&B=1" }));
    render(<PlateSearchForm />);

    search("a&b=1 ");

    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/technician/vehicles?plate=a%26b%3D1%20");
  });

  it("VEH-15 shows the not-found message and stays on the page", async () => {
    stubFetch(Response.json({ error: "No vehicle found for this plate" }, { status: 404 }));
    render(<PlateSearchForm />);

    search("ZZZ-999");

    expect(await screen.findByRole("alert")).toHaveTextContent("No vehicle found for this plate");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Search" })).toBeEnabled();
  });

  it("shows the plate message from a 400 next to the field", async () => {
    stubFetch(Response.json({ errors: { form: "Plate is required" } }, { status: 400 }));
    render(<PlateSearchForm />);

    search("   ");

    expect(await screen.findByRole("alert")).toHaveTextContent("Plate is required");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows a generic message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<PlateSearchForm />);

    search("ABC-123");

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
  });

  it("shows a generic message when the answer is not what was expected", async () => {
    stubFetch(Response.json({ unexpected: true }));
    render(<PlateSearchForm />);

    search("ABC-123");

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("clears the previous message when searching again", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: "No vehicle found for this plate" }, { status: 404 }))
      .mockResolvedValueOnce(Response.json({ id: "vehicle-7", plate: "ABC-123" }));
    vi.stubGlobal("fetch", fetchMock);
    render(<PlateSearchForm />);
    search("ZZZ-999");
    await screen.findByRole("alert");

    search("ABC-123");

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles/vehicle-7"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    let finish: (response: Response) => void = () => undefined;
    vi.stubGlobal("fetch", () => new Promise<Response>((resolve) => (finish = resolve)));
    render(<PlateSearchForm />);

    search("ABC-123");

    await waitFor(() => expect(screen.getByRole("button", { name: "Searching..." })).toBeDisabled());
    finish(Response.json({ error: "No vehicle found for this plate" }, { status: 404 }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Search" })).toBeEnabled());
  });
});
