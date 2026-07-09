import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  articles,
  fieldNotes,
  newestFirst,
} from "@/lib/resources/content";

/**
 * Resources (public name: The Resource Library) - locked copy from
 * site-copy-final-for-cursor.md (2026-07-07), PAGE 6. The copy is final
 * and implemented verbatim; do not reword or add sections.
 *
 * Articles and field notes live in `@/lib/resources/content` and render
 * newest-first; both lists show a "Coming soon." state until content
 * arrives (per Nick, 2026-07-09).
 */

export const metadata: Metadata = {
  title: "The Resource Library",
  description:
    "Articles and field notes on organizational AI adoption, AI confidence, and building a culture of creation. No gates, no jargon.",
};

function formatNoteDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ResourcesPage() {
  const sortedArticles = newestFirst(articles);
  const sortedNotes = newestFirst(fieldNotes);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">Resources</p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
            The Resource Library
          </h1>
          <p className="mt-8 max-w-[640px] font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Everything we&apos;re learning about organizational AI adoption,
            in one place. No gates, no jargon, no newsletter popup guarding
            the good stuff. Find what you need and go build something.
          </p>
        </div>
      </section>

      {/* The Library */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            The Library
          </h2>
          <p className="mt-4 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Start anywhere. Every piece stands on its own: pick whatever
            matches where you are today.
          </p>

          {sortedArticles.length > 0 ? (
            <ul className="mt-10 divide-y">
              {sortedArticles.map((article) => (
                <li key={article.href} className="py-6">
                  <Link href={article.href} className="group block">
                    <h3 className="font-serif text-2xl leading-snug text-foreground underline-offset-4 group-hover:underline">
                      {article.title}
                    </h3>
                    <p className="mt-1.5 text-base text-[var(--text-secondary)]">
                      {article.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 border-t pt-8 font-serif text-lg italic text-[var(--text-tertiary)]">
              Coming soon.
            </p>
          )}
        </div>
      </section>

      {/* Field Notes */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Field Notes
          </h2>
          <p className="mt-4 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Short, honest observations from building with AI every day. What
            surprised us, what flopped, what we can&apos;t stop using. No
            polish, no thesis, just notes from the field.
          </p>

          {sortedNotes.length > 0 ? (
            <div className="mt-10 space-y-8">
              {sortedNotes.map((note) => (
                <div
                  key={`${note.date}-${note.body.slice(0, 24)}`}
                  className="border-l-2 border-primary/40 pl-6"
                >
                  <p className="font-serif text-lg leading-relaxed text-foreground">
                    {note.body}
                  </p>
                  <p className="mono-label mt-3">
                    {formatNoteDate(note.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 border-t pt-8 font-serif text-lg italic text-[var(--text-tertiary)]">
              Coming soon.
            </p>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 text-center">
          <p className="mx-auto max-w-xl font-serif text-lg text-[var(--text-secondary)] sm:text-xl">
            New here? Hacks-a-Thon is a guided program that helps teams build
            AI confidence by creating something real.
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="pill" size="pill" asChild>
              <Link href="/how-it-works">See How the Hacks-a-Thon Works</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
