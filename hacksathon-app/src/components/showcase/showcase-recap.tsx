import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

interface ShowcaseRecapProps {
  summary: string;
}

/**
 * The AI-synthesized recap section. We render server-side because this
 * is a public page that wants to be cache-friendly and indexable.
 *
 * Visual treatment intentionally subdued: tinted left rail, generous
 * line-height, plain typography. The recap is the human story of the
 * event — it shouldn't shout.
 */
export function ShowcaseRecap({ summary }: ShowcaseRecapProps) {
  if (!summary.trim()) return null;

  return (
    <section id="recap" className="border-b bg-muted/30">
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <header className="mb-8 space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3.5" aria-hidden />
            The recap
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it went, in our own words
          </h2>
          <p className="text-sm text-muted-foreground">
            Synthesized from every participant&apos;s reflection. Edited and
            approved by the organizer.
          </p>
        </header>

        <div className="prose prose-neutral max-w-none border-l-2 border-primary/40 pl-6 text-base leading-relaxed dark:prose-invert">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
