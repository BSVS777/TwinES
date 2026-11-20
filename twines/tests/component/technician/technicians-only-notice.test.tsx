import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TechniciansOnlyNotice } from "@/components/technician/technicians-only-notice";

afterEach(cleanup);

describe("TechniciansOnlyNotice", () => {
  it("AUTH-15 tells an owner this page is for technicians, as an announced alert", () => {
    render(<TechniciansOnlyNotice />);

    expect(screen.getByRole("alert")).toHaveTextContent("Technicians only");
    expect(screen.getByRole("alert")).toHaveTextContent("Owner accounts cannot search vehicles by plate.");
    expect(screen.getByRole("link", { name: "Back to my vehicles" })).toHaveAttribute("href", "/vehicles");
  });
});
