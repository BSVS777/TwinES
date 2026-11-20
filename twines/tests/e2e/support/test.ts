import { test as base, type APIRequestContext } from "@playwright/test";
import type { Account } from "./accounts";
import { signUpOwner } from "./app";

export { expect } from "@playwright/test";

interface Fixtures {
  /** Opens an extra API context with its own cookie jar (another identity); all are disposed after the test. */
  newApi: () => Promise<APIRequestContext>;
}

export const test = base.extend<Fixtures>({
  newApi: async ({ playwright, baseURL }, provide) => {
    const contexts: APIRequestContext[] = [];
    await provide(async () => {
      const context = await playwright.request.newContext({ baseURL });
      contexts.push(context);
      return context;
    });
    await Promise.all(contexts.map((context) => context.dispose()));
  },
});

/**
 * `test` where every test starts with a throwaway owner already signed in on the page (the API
 * session is shared with the browser), so a test can create its own data without touching the seed.
 */
export const ownerTest = test.extend<{ owner: Account }>({
  owner: [
    async ({ context }, provide) => {
      await provide(await signUpOwner(context.request));
    },
    { auto: true },
  ],
});
