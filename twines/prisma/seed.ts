import "dotenv/config";
import { createContainer } from "@/infrastructure/container";
import { getDb } from "@/infrastructure/db";
import { SEED_EMAILS } from "./seed-data";
import { readSeedPasswords, seedDatabase } from "./seed-database";

/**
 * `npm run db:seed`: fills the database named by DATABASE_URL with the demo accounts and vehicles.
 * SEED_TECH_PASSWORD and SEED_OWNER_PASSWORD (8 characters or more) are required. The clock honors
 * TWINES_FIXED_TODAY under the same rules as the app (NODE_ENV `development` or `test` only).
 */
async function main() {
  // Checked before the database is opened, so a missing password fails fast.
  const passwords = readSeedPasswords(process.env);
  const db = getDb();
  try {
    const container = createContainer(db);
    const summary = await seedDatabase(container, passwords);
    console.log(`Seeded ${summary.users} accounts and ${summary.vehicles} vehicles relative to ${container.clock.today()}.`);
    console.log(`Accounts: ${Object.values(SEED_EMAILS).join(", ")}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
