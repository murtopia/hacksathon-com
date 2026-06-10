import { Diamond } from "lucide-react";

export interface WinnerListEntry {
  awardId: string;
  categoryName: string;
  winnerName: string | null;
  demoUrl: string | null;
}

interface WinnersListProps {
  winners: WinnerListEntry[];
  eyebrow?: string;
  heading?: string;
  blurb?: string;
}

/**
 * Award winners in the original Hacks.murtopolis.com "Hacky Awards"
 * format: a quiet grid of bordered cards, each a centered diamond glyph,
 * category name, winner, and a single "View project" link. No
 * screenshots - the project gallery already carries the visuals.
 */
export function WinnersList({
  winners,
  eyebrow,
  heading,
  blurb,
}: WinnersListProps) {
  if (winners.length === 0) return null;

  return (
    <section id="winners" className="border-b">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4 py-16 sm:py-20">
        <header className="mb-10 space-y-2 text-center">
          <p className="mono-label">{eyebrow ?? "The Hacky Awards"}</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {heading ?? "Celebrating what matters"}
          </h2>
          <p className="lead mx-auto">
            {blurb ?? "Winners announced at the Showcase Showdown."}
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {winners.map((winner) => (
            <article
              key={winner.awardId}
              className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center shadow-sm sm:p-8"
            >
              <Diamond
                aria-hidden
                className="size-4 text-muted-foreground/50"
                fill="currentColor"
              />
              <h3 className="font-serif text-lg leading-snug tracking-tight">
                {winner.categoryName}
              </h3>
              {winner.winnerName && (
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                  {winner.winnerName}
                </p>
              )}
              {winner.demoUrl && (
                <a
                  href={winner.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  View project &rarr;
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
