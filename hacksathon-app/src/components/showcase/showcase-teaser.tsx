interface ShowcaseTeaserProps {
  logoUrl: string | null;
  orgName: string | null;
  eventTitle: string;
  /** Human-readable hint like "Sometime in March 2026" - null hides the line. */
  expectedRevealLabel: string | null;
}

/**
 * Pre-reveal teaser variant. Used when `public_showcase = true` is on
 * but voting hasn't been revealed yet - i.e., the organizer wants their
 * vanity URL discoverable, but the results aren't in.
 *
 * Marketing-friendly: same hero language as the revealed page so the
 * URL doesn't look broken when shared early. No data leaks: ideas and
 * winners are not rendered here.
 */
export function ShowcaseTeaser({
  logoUrl,
  orgName,
  eventTitle,
  expectedRevealLabel,
}: ShowcaseTeaserProps) {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/60 to-background">
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 py-24 text-center sm:py-32">
        <div className="flex justify-center">
          {logoUrl ? (
            <div className="h-20 w-auto min-w-[80px] max-w-[320px] overflow-hidden rounded-lg border bg-background shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${orgName ?? eventTitle} logo`}
                className="h-full w-auto object-contain"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="flex h-20 w-20 items-center justify-center rounded-lg border bg-background text-2xl font-semibold text-muted-foreground shadow-sm"
            >
              {(orgName ?? eventTitle).slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-7 space-y-3">
          {orgName && <p className="mono-label">{orgName} Hacks-a-Thon</p>}
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            {eventTitle}
          </h1>
          <p className="lead mx-auto">
            Coming soon to this page: winners, every idea, and the recap.
          </p>
        </div>

        <div className="mt-10 inline-flex items-center rounded-full border bg-background px-4 py-2 font-mono text-xs uppercase tracking-wide text-[var(--text-tertiary)] shadow-sm">
          {expectedRevealLabel ?? "Results will be live once the team votes."}
        </div>
      </div>
    </section>
  );
}
