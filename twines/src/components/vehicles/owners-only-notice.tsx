/**
 * What a technician sees on the owner-only vehicle pages (AUTH-15 mirrored). The pages answer
 * with this message instead of redirecting, because the technician area is a separate part of
 * the app and the owner's pages simply are not for them.
 */
export function OwnersOnlyNotice() {
  return (
    <section role="alert">
      <h1>Owners only</h1>
      <p>Technician accounts cannot register or manage vehicles.</p>
    </section>
  );
}
