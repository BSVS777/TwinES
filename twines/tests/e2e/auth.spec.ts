import type { Page } from "@playwright/test";
import { randomPassword, seedOwnerAccount, uniqueEmail } from "./support/accounts";
import { open, post, signInUi, signUpOwner } from "./support/app";
import { expect, test } from "./support/test";

/** The error paragraph of the form (the framework's route announcer also has role="alert"). */
const formAlert = (page: Page) => page.locator("form").getByRole("alert");

/** An owner created through the API; the page's own cookies are cleared so it stays anonymous. */
async function createAccountForSignIn(page: Page) {
  const owner = await signUpOwner(page.context().request);
  await page.context().clearCookies();
  return owner;
}

async function submitSignIn(page: Page, email: string, password: string) {
  await open(page, "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("authentication", () => {
  test("AUTH-01 a visitor signs up, is stored in lowercase as an owner and lands on the vehicle list", async ({ page }) => {
    const email = uniqueEmail("Ana");
    await open(page, "/sign-up");
    await page.getByLabel("Email").fill(email.replace("@example.com", "@Example.COM"));
    await page.getByLabel("Password").fill(randomPassword());
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/vehicles$/);
    await expect(page.getByRole("heading", { name: "Your vehicles" })).toBeVisible();
    // The shell shows the stored email: lowercase.
    await expect(page.getByText(email.toLowerCase())).toBeVisible();
    // Owner role: the technician page is refused.
    const technician = await page.request.get("/technician");
    expect(technician.status()).toBe(403);
  });

  test("AUTH-07 an owner signs in and lands on the vehicle list", async ({ page }) => {
    await signInUi(page, seedOwnerAccount());
    await expect(page.getByRole("heading", { name: "Your vehicles" })).toBeVisible();
    await expect(page.getByRole("link", { name: "TWN-GRN Toyota Corolla 2022" })).toBeVisible();
  });

  test("AUTH-08 a wrong password and an unknown email give the identical generic message", async ({ page }) => {
    // A throwaway account, so the failed attempt does not count against a seed account.
    const owner = await createAccountForSignIn(page);

    const messages: string[] = [];
    for (const attempt of [
      { email: owner.email, password: `${randomPassword()}x` },
      { email: uniqueEmail("nobody"), password: randomPassword() },
    ]) {
      await submitSignIn(page, attempt.email, attempt.password);
      await expect(formAlert(page)).toBeVisible();
      messages.push((await formAlert(page).textContent()) ?? "");
      await expect(page).toHaveURL(/\/sign-in$/);
    }
    expect(messages).toEqual(["Invalid email or password", "Invalid email or password"]);
  });

  test("AUTH-10 the sixth sign-in is locked out after five failures, even with the correct password", async ({ page, newApi }) => {
    // A throwaway email: the lockout is per email and would otherwise block a seed account.
    const owner = await signUpOwner(await newApi());

    const anonymous = await newApi();
    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await post(anonymous, "/api/auth/sign-in", { email: owner.email, password: `${randomPassword()}x` });
      expect(response.status(), `failed attempt ${attempt}`).toBe(401);
    }

    await submitSignIn(page, owner.email, owner.password);
    await expect(formAlert(page)).toHaveText("Too many attempts, try again later");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("AUTH-12 after sign-out the old session cookie is treated as unauthenticated at page level", async ({ page, context }) => {
    const owner = await createAccountForSignIn(page);
    await signInUi(page, owner);

    const session = (await context.cookies()).find((cookie) => cookie.name === "twines_session");
    expect(session).toBeDefined();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);

    // Put the signed-out cookie back: the proxy lets a request with a cookie through, so only the
    // real session check can reject it.
    await context.addCookies([session!]);
    await page.goto("/vehicles");
    await expect(page).toHaveURL(/\/sign-in$/);
    const api = await page.request.get("/api/vehicles");
    expect(api.status()).toBe(401);
  });

  test("AUTH-13 an anonymous visitor is redirected to sign-in", async ({ page }) => {
    for (const path of ["/vehicles", "/vehicles/new", "/technician"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/sign-in$/);
    }
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
