// Rebuilds the end-to-end database: deletes e2e.db, applies the migrations and runs the seed.
// It runs as the first step of the web server command (see playwright.config.ts) with
// DATABASE_URL, SEED_TECH_PASSWORD and SEED_OWNER_PASSWORD already in the environment.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const E2E_DATABASE_URL = "file:./e2e.db";

// Deleting files is only safe for the dedicated end-to-end database, never for development data.
if (process.env.DATABASE_URL !== E2E_DATABASE_URL) {
  console.error(`Refusing to reset a database other than ${E2E_DATABASE_URL}.`);
  process.exit(1);
}

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  rmSync(`e2e.db${suffix}`, { force: true });
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
