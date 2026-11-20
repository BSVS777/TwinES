import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

// Never 3100: another local service may hold it. Override with E2E_PORT when 3200 is taken.
const PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE_URL = `http://localhost:${PORT}`;

/**
 * The seed accounts' passwords are random for every run and exist only in the environment: they
 * are generated here, in the process that starts the run, and every worker inherits them. They are
 * handed to the seed (through the web server) and to the tests (see tests/e2e/support/accounts.ts).
 */
function randomPassword(): string {
  // The prefix guarantees a letter and a digit, whatever the random part holds.
  return `Aa1-${randomBytes(12).toString("base64url")}`;
}
const techPassword = (process.env.E2E_TECH_PASSWORD ??= randomPassword());
const ownerPassword = (process.env.E2E_OWNER_PASSWORD ??= randomPassword());

export default defineConfig({
  testDir: "tests/e2e",
  // One worker: every file shares the single SQLite database, and a failure should be reproducible.
  workers: 1,
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
    // Playwright starts the web server before any global setup, so the database is rebuilt by the
    // server's own command: a fresh e2e.db (migrated and seeded) exists before the app opens it.
    // The production build is what runs, so the suite exercises the output that ships.
    command: `node tests/e2e/support/prepare-database.mjs && npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    // A reused server would keep an old database, so a server that is already up is an error.
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      // Dedicated SQLite file so end-to-end runs never touch development data.
      DATABASE_URL: "file:./e2e.db",
      SEED_TECH_PASSWORD: techPassword,
      SEED_OWNER_PASSWORD: ownerPassword,
    },
  },
});
