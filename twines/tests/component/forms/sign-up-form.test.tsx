import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpForm } from "@/components/forms/sign-up-form";

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
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

beforeEach(() => {
  router.push.mockReset();
  router.refresh.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SignUpForm", () => {
  it("has labelled fields, states the password rule up front and links to sign in", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "At least 8 characters, including a letter and a digit.",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in");
  });

  it("AUTH-01 posts the new account and goes to the vehicle list on success", async () => {
    const fetchMock = stubFetch(Response.json({ user: {} }, { status: 201 }));
    render(<SignUpForm />);

    fillAndSubmit("Ana@Example.com", "secret123");

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/sign-up",
      expect.objectContaining({ body: JSON.stringify({ email: "Ana@Example.com", password: "secret123" }) }),
    );
  });

  it("AUTH-02 shows the duplicate email message under the email field", async () => {
    stubFetch(Response.json({ errors: { email: "An account with this email already exists" } }, { status: 409 }));
    render(<SignUpForm />);

    fillAndSubmit("ana@example.com", "secret123");

    const email = screen.getByLabelText("Email");
    await waitFor(() => expect(email).toHaveAccessibleDescription("An account with this email already exists"));
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("AUTH-03 explains the password rule next to the password field", async () => {
    const rule = "Password must have at least 8 characters, including a letter and a digit";
    stubFetch(Response.json({ errors: { password: rule } }, { status: 400 }));
    render(<SignUpForm />);

    fillAndSubmit("ana@example.com", "abcdefg");

    const password = screen.getByLabelText("Password");
    await waitFor(() => expect(password).toHaveAttribute("aria-invalid", "true"));
    expect(password).toHaveAccessibleDescription(expect.stringContaining(rule));
  });

  it("AUTH-04 shows the invalid email message next to the email field", async () => {
    stubFetch(Response.json({ errors: { email: "Enter a valid email address" } }, { status: 400 }));
    render(<SignUpForm />);

    fillAndSubmit("ana@", "secret123");

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email address"),
    );
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid", "true");
  });

  it("clears the previous errors when the form is submitted again", async () => {
    stubFetch(Response.json({ errors: { email: "Enter a valid email address" } }, { status: 400 }));
    render(<SignUpForm />);
    fillAndSubmit("ana@", "secret123");
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true"));

    stubFetch(Response.json({ user: {} }, { status: 201 }));
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/vehicles"));
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid", "true");
  });
});
