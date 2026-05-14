import { ExternalLink, Lightbulb } from "lucide-react";

export interface IdeaGalleryEntry {
  ideaId: string;
  title: string;
  pitch: string | null;
  authorName: string | null;
  liveUrl: string | null;
  screenshotUrl: string | null;
  heroCropX: number;
  isWinner: boolean;
}

interface IdeaGalleryProps {
  ideas: IdeaGalleryEntry[];
}

/**
 * Browsable grid of every idea submitted to the event. Winners get a
 * subtle ribbon (the marquee winner cards live above in WinnersGrid).
 *
 * No pagination yet — typical event size is 5–30 ideas, which renders
 * comfortably. If we ever support 100+ idea events, we'll swap this for
 * a virtualized list.
 */
export function IdeaGallery({ ideas }: IdeaGalleryProps) {
  if (ideas.length === 0) return null;

  return (
    <section id="ideas" className="border-b">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <header className="mb-10 space-y-2 text-center">
          <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Lightbulb className="size-3.5" aria-hidden />
            Every idea
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What our team built
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"} shipped.
            Click through to see the live demos.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.ideaId} idea={idea} />
          ))}
        </div>
      </div>
    </section>
  );
}

function IdeaCard({ idea }: { idea: IdeaGalleryEntry }) {
  const content = (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-md border bg-card shadow-sm transition-all ${
        idea.liveUrl
          ? "group-hover:-translate-y-0.5 group-hover:shadow-md"
          : ""
      }`}
    >
      {idea.screenshotUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={idea.screenshotUrl}
            alt={`${idea.title} screenshot`}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${clampPercent(idea.heroCropX)}% 50%`,
            }}
          />
          {idea.isWinner && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-50 shadow-sm">
              Winner
            </span>
          )}
        </div>
      ) : (
        <div
          aria-hidden
          className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground"
        >
          <Lightbulb className="size-8" />
          {idea.isWinner && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-50 shadow-sm">
              Winner
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight">
          {idea.title}
        </h3>
        {idea.pitch && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {idea.pitch}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs">
          {idea.authorName ? (
            <span className="truncate text-muted-foreground">
              by{" "}
              <span className="font-medium text-foreground">
                {idea.authorName}
              </span>
            </span>
          ) : (
            <span />
          )}
          {idea.liveUrl && (
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-primary">
              Visit
              <ExternalLink className="size-3" aria-hidden />
            </span>
          )}
        </div>
      </div>
    </article>
  );

  if (idea.liveUrl) {
    return (
      <a
        href={idea.liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {content}
      </a>
    );
  }

  return content;
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}
