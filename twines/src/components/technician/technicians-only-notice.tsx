import Link from "next/link";

/**
 * What an owner sees on the technician pages (AUTH-15 mirrored). Like the owners-only notice it
 * is a page, not a redirect: the technician area simply is not for owner accounts.
 */
export function TechniciansOnlyNotice() {
  return (
    <section role="alert">
      <h1>Technicians only</h1>
      <p>Owner accounts cannot search vehicles by plate.</p>
      <Link href="/vehicles">Back to my vehicles</Link>
    </section>
  );
}
