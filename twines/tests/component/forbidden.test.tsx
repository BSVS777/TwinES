import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Forbidden from "@/app/forbidden";

afterEach(cleanup);

describe("Forbidden page", () => {
  it("AUTH-15 tells the visitor access is denied under a main landmark", () => {
    render(<Forbidden />);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Access denied" })).toBeInTheDocument();
    expect(screen.getByText("Your account type cannot open this page.")).toBeInTheDocument();
  });

  it("offers a way back that works for either role", () => {
    render(<Forbidden />);

    expect(screen.getByRole("link", { name: "Back to start" })).toHaveAttribute("href", "/vehicles");
  });
});
