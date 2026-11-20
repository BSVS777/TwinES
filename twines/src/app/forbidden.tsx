import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Access denied | TwinES" };

/**
 * What `forbidden()` renders, with a real 403 status (AUTH-15): an owner on a technician page or a
 * technician on an owner page. The vehicles page sends each role on to its own start page, so one
 * link serves both.
 */
export default function Forbidden() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Access denied</h1>
      <p>Your account type cannot open this page.</p>
      <Link href="/vehicles">Back to start</Link>
    </main>
  );
}
