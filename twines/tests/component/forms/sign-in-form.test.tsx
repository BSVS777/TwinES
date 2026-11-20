import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "@/components/forms/sign-in-form";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SignInForm", () => {
  it("has labelled email and password fields and a link to sign up", () => {
    render(<SignInForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/sign-up");
  });

  it("AUTH-07 posts the credentials and goes to the vehicle list on success", async () => {
    const fetchMock = stubFetch(Response.json({ user: {} }));
    render(<SignInForm />);

    fillAndSubmit("ana@example.com", "secret123");

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/sign-in",
      expect.objectContaining({ body: JSON.stringify({ email: "ana@example.com", password: "secret123" }) }),
    );
  });

  it("AUTH-08 shows the generic message and stays on the page for a failed sign-in", async () => {
    stubFetch(Response.json({ error: "Invalid email or password" }, { status: 401 }));
    render(<SignInForm />);

    fillAndSubmit("ana@example.com", "wrong-pass1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("AUTH-10 shows the lockout message from a 429 response", async () => {
    stubFetch(Response.json({ error: "Too many attempts, try again later" }, { status: 429 }));
    render(<SignInForm />);

    fillAndSubmit("ana@example.com", "secret123");

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts, try again later");
  });

  it("shows a validation message next to its field and marks only that field invalid", async () => {
    stubFetch(Response.json({ errors: { email: "Enter a valid email address" } }, { status: 400 }));
    render(<SignInForm />);

    fillAndSubmit("ana@", "secret123");

    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(email).toHaveAccessibleDescription("Enter a valid email address");
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("disables the button while the request is in flight", async () => {
    let finish: (response: Response) => void = () => undefined;
    vi.stubGlobal("fetch", () => new Promise<Response>((resolve) => (finish = resolve)));
    render(<SignInForm />);

    fillAndSubmit("ana@example.com", "secret123");

    await waitFor(() => expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled());
    finish(Response.json({ error: "Invalid email or password" }, { status: 401 }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled());
  });
});
