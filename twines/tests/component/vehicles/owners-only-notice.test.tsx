import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OwnersOnlyNotice } from "@/components/vehicles/owners-only-notice";

afterEach(cleanup);

describe("OwnersOnlyNotice", () => {
  it("tells a technician this page is for owners, as an announced alert", () => {
    render(<OwnersOnlyNotice />);

    expect(screen.getByRole("alert")).toHaveTextContent("Owners only");
    expect(screen.getByRole("alert")).toHaveTextContent("Technician accounts cannot register or manage vehicles.");
  });
});
