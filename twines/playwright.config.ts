import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production build, so end-to-end runs exercise the same output that ships.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // Dedicated SQLite file so end-to-end runs never touch development data.
      DATABASE_URL: "file:./e2e.db",
      // Fixed calendar day (YYYY-MM-DD) for deterministic health results; the suite sets it.
      TWINES_FIXED_TODAY: process.env.TWINES_FIXED_TODAY ?? "",
    },
  },
});
