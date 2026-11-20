import { test as base, type APIRequestContext } from "@playwright/test";

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
