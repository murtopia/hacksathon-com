/**
 * Murtopolis segment loading state. Renders inside the gated layout
 * (the sub-nav stays put), so this is just a quiet placeholder for the
 * data region while the server fetches cross-tenant analytics.
 */
export default function MurtopolisLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[4px] border bg-muted/40"
          />
        ))}
      </div>
      <div className="h-60 animate-pulse rounded-[4px] border bg-muted/30" />
    </div>
  );
}
