import { Download, ExternalLink } from "lucide-react";

export interface WinnerEntry {
  awardId: string;
  categoryName: string;
  categoryDescription: string | null;
  ideaTitle: string;
  ideaPitch: string | null;
  ideaDescription: string | null;
  authorName: string | null;
  authorEmail: string | null;
  liveUrl: string | null;
  projectUrl: string | null;
  screenshotUrl: string | null;
  heroCropX: number;
}

interface WinnersGridProps {
  winners: WinnerEntry[];
  /** Vanity slug - used to build shareable winner-card download links. */
  slug?: string;
}

/**
 * The hero results panel: one prominent card per award category. Each
 * card displays the category, the winning idea, the author's display
 * name, the screenshot (with the same focal-point crop the participant
 * picked in IdeaLab), and a single "Visit live demo" CTA if the team
 * shipped a live link.
 *
 * Why one card per category instead of a leaderboard: M4's reveal-time
 * tally writes exactly one winner per category. Showing only that
 * matches the spec (no vote counts) and keeps the page focused.
 */
export function WinnersGrid({ winners, slug }: WinnersGridProps) {
  if (winners.length === 0) return null;

  return (
    <section id="winners" className="border-b">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4 py-16 sm:py-20">
        <header className="mb-10 space-y-2 text-center">
          <p className="mono-label">Hacky Awards</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            The winners
          </h2>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {winners.map((winner) => (
            <WinnerCard key={winner.awardId} winner={winner} slug={slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WinnerCard({
  winner,
  slug,
}: {
  winner: WinnerEntry;
  slug?: string;
}) {
  const demoUrl = winner.liveUrl ?? winner.projectUrl ?? null;
  const description =
    winner.ideaPitch?.trim() || winner.ideaDescription?.trim() || null;
  const cardSlugBase = winner.categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      {winner.screenshotUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={winner.screenshotUrl}
            alt={`${winner.ideaTitle} screenshot`}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${clampPercent(winner.heroCropX)}% 50%`,
            }}
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-muted to-muted/40 font-serif text-5xl text-muted-foreground"
        >
          {winner.ideaTitle.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="mono-label text-amber-700 dark:text-amber-400">
            {winner.categoryName}
          </p>
          {winner.categoryDescription && (
            <p className="text-xs text-muted-foreground">
              {winner.categoryDescription}
            </p>
          )}
        </div>

        <h3 className="text-xl leading-tight tracking-tight">
          {winner.ideaTitle}
        </h3>

        {description && (
          <p className="line-clamp-4 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {winner.authorName && (
            <p className="truncate text-sm">
              <span className="text-muted-foreground">by</span>{" "}
              <span className="font-medium">{winner.authorName}</span>
            </p>
          )}
          <div className="flex shrink-0 items-center gap-3">
            {slug && (
              <a
                href={`/${slug}/awards/card/${winner.awardId}`}
                download={`hacky-award-${cardSlugBase || "winner"}.png`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
              >
                <Download className="size-3.5" aria-hidden />
                Card
              </a>
            )}
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Visit
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}
