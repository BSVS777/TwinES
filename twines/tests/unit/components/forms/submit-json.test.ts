import { afterEach, describe, expect, it, vi } from "vitest";
import { submitJson } from "@/components/forms/submit-json";

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitJson", () => {
  it("posts the body as JSON and reports success for a 2xx response", async () => {
    const fetchMock = stubFetch(Response.json({ user: {} }, { status: 201 }));

    const result = await submitJson("/api/auth/sign-in", { email: "ana@example.com", password: "secret123" });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "ana@example.com", password: "secret123" }),
    });
  });

  it("sends with the given method, for edits and replacements", async () => {
    const fetchMock = stubFetch(Response.json({ vehicle: {} }));

    const result = await submitJson("/api/vehicles/v1", { make: "Mazda" }, "PATCH");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/vehicles/v1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ make: "Mazda" }),
    });
  });

  it("returns the per-field errors of a 400 or 409 response", async () => {
    stubFetch(Response.json({ errors: { email: "Enter a valid email address" } }, { status: 400 }));
    expect(await submitJson("/x", {})).toEqual({ ok: false, errors: { email: "Enter a valid email address" } });

    stubFetch(Response.json({ errors: { email: "An account with this email already exists" } }, { status: 409 }));
    expect(await submitJson("/x", {})).toEqual({
      ok: false,
      errors: { email: "An account with this email already exists" },
    });
  });

  it("puts the message of a 401, 403 or 429 response under the form key", async () => {
    stubFetch(Response.json({ error: "Invalid email or password" }, { status: 401 }));
    expect(await submitJson("/x", {})).toEqual({ ok: false, errors: { form: "Invalid email or password" } });

    stubFetch(Response.json({ error: "Too many attempts, try again later" }, { status: 429 }));
    expect(await submitJson("/x", {})).toEqual({ ok: false, errors: { form: "Too many attempts, try again later" } });
  });

  it("uses a generic message when the answer is unreadable or the request never arrived", async () => {
    const generic = { ok: false, errors: { form: "Something went wrong. Please try again." } };

    stubFetch(Response.json({ error: "Internal server error" }, { status: 500 }));
    expect(await submitJson("/x", {})).toEqual({ ok: false, errors: { form: "Internal server error" } });

    stubFetch(new Response("<html>bad gateway</html>", { status: 502 }));
    expect(await submitJson("/x", {})).toEqual(generic);

    stubFetch(new TypeError("Failed to fetch"));
    expect(await submitJson("/x", {})).toEqual(generic);
  });
});
