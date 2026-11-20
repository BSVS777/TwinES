import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Resolved against the working directory (`twines/`) by both the Prisma CLI and the driver adapter.
const databaseFile = "test-integration.db";

function removeDatabaseFiles() {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`${databaseFile}${suffix}`, { force: true });
  }
}

/** Creates a fresh SQLite file with every migration applied, and removes it afterwards. */
export default function setup() {
  removeDatabaseFiles();
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: `file:./${databaseFile}` },
  });
  return removeDatabaseFiles;
}
