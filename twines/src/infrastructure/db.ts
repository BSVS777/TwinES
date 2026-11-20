import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js dev reloads modules on every edit; keeping the client on globalThis avoids
// opening a new SQLite connection each time.
const globalForDb = globalThis as unknown as { twinesDb?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}

/** Lazily creates the shared client so importing this module never needs the environment. */
export function getDb(): PrismaClient {
  globalForDb.twinesDb ??= createClient();
  return globalForDb.twinesDb;
}
