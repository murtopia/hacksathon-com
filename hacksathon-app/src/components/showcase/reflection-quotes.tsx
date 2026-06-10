export interface ReflectionQuote {
  id: string;
  answer: string;
  respondentName: string | null;
  question: string | null;
}

interface ReflectionQuotesProps {
  quotes: ReflectionQuote[];
  eyebrow?: string;
  heading?: string;
  blurb?: string;
}

/**
 * A pull-quote wall of standout participant reflections (the ones an
 * organizer flagged `is_featured`). Sits alongside the AI recap: the
 * recap is the synthesized story, this is the raw human voice.
 *
 * Rendered as a masonry-ish responsive column layout so quotes of
 * varying length pack tightly without awkward gaps.
 */
export function ReflectionQuotes({
  quotes,
  eyebrow,
  heading,
  blurb,
}: ReflectionQuotesProps) {
  if (quotes.length === 0) return null;

  return (
    <section id="voices" className="border-b">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4 py-16 sm:py-20">
        <header className="mb-10 space-y-2 text-center">
          <p className="mono-label">{eyebrow ?? "In their words"}</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {heading ?? "What the team took away"}
          </h2>
          {blurb && <p className="lead mx-auto">{blurb}</p>}
        </header>

        <div className="gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {quotes.map((quote) => (
            <figure
              key={quote.id}
              className="break-inside-avoid rounded-lg border bg-card p-5 shadow-sm"
            >
              {quote.question && (
                <figcaption className="mono-label mb-2 text-muted-foreground">
                  {quote.question}
                </figcaption>
              )}
              <blockquote className="text-[0.95rem] leading-relaxed text-foreground">
                &ldquo;{quote.answer}&rdquo;
              </blockquote>
              {quote.respondentName && (
                <figcaption className="mt-3 text-sm font-medium text-muted-foreground">
                  - {quote.respondentName}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
