/**
 * The Seven2 case-study narrative layer - locked copy from
 * site-copy-final-for-cursor.md (2026-07-07), PAGE 8. These static
 * sections wrap the live, data-driven Seven2 showcase at /seven2.
 * Copy is final and verbatim; do not reword.
 */

const stats = [
  "19 participants",
  "19 projects shipped",
  "100% completion",
  "~2.5 weeks, part-time",
  "0 outside facilitators",
];

const proved = [
  "Non-technical people ship real projects when the structure carries them.",
  "Short sessions between client work are enough. No weekend required.",
  "The confidence outlasts the event. The team kept building after it ended.",
];

/** Opening: headline, intro, stat band, and "What Seven2 proved". */
export function Seven2Opening() {
  return (
    <section className="border-b py-20 md:py-24">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
        <h1 className="max-w-3xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
          The Seven2 Case Study
        </h1>
        <p className="mt-8 max-w-[640px] font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
          In spring 2026, Seven2, a 19-person creative agency, ran the first
          Hacks-a-Thon. Nineteen participants. Nineteen projects. Nineteen
          working builds, from people who had mostly never written a line of
          code. Here&apos;s the whole story, and every project they made.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-y py-5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground sm:text-sm">
          {stats.map((stat, i) => (
            <span key={stat} className="flex items-center gap-3">
              {stat}
              {i < stats.length - 1 && (
                <span aria-hidden className="text-[var(--text-tertiary)]">
                  &middot;
                </span>
              )}
            </span>
          ))}
        </div>

        <div className="mt-10">
          <p className="mono-label mb-4">What Seven2 proved</p>
          <ul className="max-w-[640px] space-y-3">
            {proved.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]"
              >
                <span className="mt-0.5 shrink-0 text-foreground">
                  &#10003;
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The Setup: renders before the project gallery. */
export function Seven2Setup() {
  return (
    <section className="border-b bg-muted/30">
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 py-16 sm:py-20">
        <header className="mb-8">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            The Setup
          </h2>
        </header>
        <div className="space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
          <p>
            Seven2 had the same problem most companies have. The team knew AI
            mattered, but almost nobody was touching it. Some were nervous,
            some were skeptical, and plenty of clients were banning AI
            outright. Sound familiar?
          </p>
          <p>
            So instead of another training session, the whole company,
            producers, designers, writers, animators, the front desk, the
            founders, committed to one structured event: everyone builds
            something they personally want to exist, in short time-blocked
            sessions between client work, ending with demos and awards.
          </p>
        </div>
      </div>
    </section>
  );
}

/** What Happened After: renders after the recap, before the final CTA. */
export function Seven2WhatHappenedAfter() {
  return (
    <section className="border-b">
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 py-16 sm:py-20">
        <header className="mb-8">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            What Happened After
          </h2>
        </header>
        <div className="space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
          <p>
            Here&apos;s the part no one planned. The event ended, and the
            building didn&apos;t. In the weeks after, team members shipped
            workflow boards, storyboarding tools, and resourcing fixes nobody
            asked for. Conversations shifted from &ldquo;what can AI
            do?&rdquo; to &ldquo;what could we build?&rdquo; A team that had
            been nervous about AI started reaching for it like any other tool
            of the trade.
          </p>
          <p>
            That shift is the reason Hacksathon.com exists. The projects on
            this page are what one team made in two and a half weeks. What
            they made afterward is the point.
          </p>
        </div>
      </div>
    </section>
  );
}
