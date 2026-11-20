import { getDb } from "@/infrastructure/db";

/** Empties every table so each test starts from a known state. */
export async function resetDatabase() {
  const db = getDb();
  await db.partBaseline.deleteMany();
  await db.vehicle.deleteMany();
  await db.session.deleteMany();
  await db.loginThrottle.deleteMany();
  await db.user.deleteMany();
}
