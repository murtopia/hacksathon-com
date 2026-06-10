import Link from "next/link";

export interface ShowcaseHeroProps {
  logoUrl: string | null;
  orgName: string | null;
  eventTitle: string;
  dateRangeLabel: string | null;
  winnerCount: number;
  ideaCount: number;
  hasRecap: boolean;
}

/**
 * The above-the-fold hero for a revealed public showcase.
 *
 * Anchors:
 *   - logo + org eyebrow + event title
 *   - one-line "we shipped X projects, picked Y winners, here's the recap"
 *   - jump links to the three main sections (Winners, Ideas, Recap)
 *
 * This is the unit a marketer screenshots for a case-study link, so we
 * keep it visually punchy: large type, generous whitespace, and quiet
 * typographic styling (no decorative iconography per the design system).
 */
export function ShowcaseHero({
  logoUrl,
  orgName,
  eventTitle,
  dateRangeLabel,
  winnerCount,
  ideaCount,
  hasRecap,
}: ShowcaseHeroProps) {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/60 to-background">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4 py-16 sm:py-24">
        <div className="flex flex-col items-center gap-6 text-center">
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

          <div className="space-y-3">
            {orgName && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {orgName} Hacks-a-Thon
              </p>
            )}
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
              {eventTitle}
            </h1>
            {dateRangeLabel && (
              <p className="text-sm text-muted-foreground sm:text-base">
                {dateRangeLabel}
              </p>
            )}
          </div>

          <p className="max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {summarize({ winnerCount, ideaCount, hasRecap })}
          </p>

          <nav
            aria-label="Showcase sections"
            className="flex flex-wrap items-center justify-center gap-2 pt-3 text-sm"
          >
            {winnerCount > 0 && (
              <Link
                href="#winners"
                className="rounded-full border bg-background px-4 py-1.5 font-medium transition-colors hover:bg-muted"
              >
                Winners
              </Link>
            )}
            {ideaCount > 0 && (
              <Link
                href="#ideas"
                className="rounded-full border bg-background px-4 py-1.5 font-medium transition-colors hover:bg-muted"
              >
                All ideas
              </Link>
            )}
            {hasRecap && (
              <Link
                href="#recap"
                className="rounded-full border bg-background px-4 py-1.5 font-medium transition-colors hover:bg-muted"
              >
                The recap
              </Link>
            )}
          </nav>
        </div>
      </div>
    </section>
  );
}

function summarize({
  winnerCount,
  ideaCount,
  hasRecap,
}: {
  winnerCount: number;
  ideaCount: number;
  hasRecap: boolean;
}): string {
  if (winnerCount === 0 && ideaCount === 0) {
    return "A peek at our Hacks-a-Thon.";
  }
  const parts: string[] = [];
  if (ideaCount > 0) {
    parts.push(
      `${ideaCount} idea${ideaCount === 1 ? "" : "s"} shipped`,
    );
  }
  if (winnerCount > 0) {
    parts.push(
      `${winnerCount} winner${winnerCount === 1 ? "" : "s"} celebrated`,
    );
  }
  const lead = parts.join(" · ");
  const tail = hasRecap ? " - here's the recap." : ".";
  return `${lead}${tail}`;
}
