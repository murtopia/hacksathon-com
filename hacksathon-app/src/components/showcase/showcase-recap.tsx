import ReactMarkdown from "react-markdown";

interface ShowcaseRecapProps {
  summary: string;
  /** Optional eyebrow line above the heading (e.g. event name). Defaults to "The recap". */
  eyebrow?: string;
  /** Optional bold headline. Defaults to "How it went, in our own words". */
  heading?: string;
}

/**
 * The AI-synthesized recap section. We render server-side because this
 * is a public page that wants to be cache-friendly and indexable.
 *
 * A static teaser subhead sits under the heading, and the full summary
 * renders as the body beneath it. Visual treatment intentionally subdued:
 * generous line-height, plain typography. The recap is the human story of
 * the event - it shouldn't shout.
 */
export function ShowcaseRecap({ summary, eyebrow, heading }: ShowcaseRecapProps) {
  const trimmed = summary.trim();
  if (!trimmed) return null;

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="recap" className="border-b bg-muted/30">
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 py-16 sm:py-20">
        <header className="mb-8 space-y-2">
          <p className="mono-label">{eyebrow ?? "The recap"}</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {heading ?? "How it went, in our own words"}
          </h2>
          <p className="lead">
            How it went in our own words, well at least in this AI summary of
            our reflections
          </p>
        </header>

        {paragraphs.length > 0 && (
          <div className="space-y-5">
            {paragraphs.map((para, i) => (
              <ReactMarkdown
                key={i}
                components={{
                  p: ({ children }) => (
                    <p className="font-serif text-[17px] leading-relaxed text-[var(--text-secondary)]">
                      {children}
                    </p>
                  ),
                }}
              >
                {para}
              </ReactMarkdown>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
