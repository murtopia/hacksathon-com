import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Homepage - locked copy from site-copy-final-for-cursor.md (2026-07-07).
 * The copy is final and implemented verbatim; do not reword or add
 * sections. Layout only here.
 */

export const metadata: Metadata = {
  title: "Accelerate AI Adoption by Empowering Every Employee",
  description:
    "Hacks-a-Thon gives every employee a guided path to create real solutions with AI. Proven with real non-technical teams: 19 participants, 19 projects, 100% shipped.",
};

const reflections = [
  {
    quote:
      "I have definitely found myself thinking in response to every problem I have recently, 'Oh, I could make a solution for that,' rather than 'Someone should make an app for that.'",
    attribution: "Sena, Seven2 Participant",
  },
  {
    quote: "If you have a vision, you can build it.",
    attribution: "Christina, Seven2 Participant",
  },
  {
    quote:
      "Hacks-a-Thon definitely proved that anyone can make an app or website using current AI and vibe coding platforms.",
    attribution: "Adam, Seven2 Participant",
  },
];

function SeeHowItWorksButton() {
  return (
    <Button variant="pill" size="pill" asChild>
      <Link href="/how-it-works">See How It Works</Link>
    </Button>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">
            Helping every employee adopt AI. Proven with real non-technical
            teams.
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Accelerate AI Adoption by Empowering Every Employee to Create
            Solutions
          </h1>
          <p className="mt-5 font-serif text-lg italic text-[var(--text-secondary)] sm:text-xl">
            A structured Hacks-a-Thon program you can easily run for your own
            team.
          </p>

          <div className="mt-10 max-w-[640px] space-y-5">
            <p className="font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
              Hacks-a-Thon gives every employee a clear, guided path to
              creating practical solutions with AI, building confidence that
              lasts long after the event ends.
            </p>
            <p className="font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
              The result? Greater AI adoption, lasting AI confidence, and a
              culture where innovation comes from everyone, not just technical
              teams.
            </p>
          </div>

          <div className="mt-10">
            <SeeHowItWorksButton />
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <h2 className="font-serif text-4xl font-normal tracking-tight sm:text-5xl">
            AI isn&apos;t your biggest challenge.
            <span className="mt-2 block italic">Adoption is.</span>
          </h2>
          <div className="mt-8 max-w-[640px] space-y-5">
            <p className="font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
              Most companies already have access to AI. Many have invested in
              AI tools and training. Yet employees are overwhelmed and
              don&apos;t know where to begin.
            </p>
            <p className="font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
              They&apos;re unsure which tools to trust or how AI fits into the
              work they do every day. Without confidence, adoption slows.
            </p>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="border-b bg-foreground text-background">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 py-8">
          <p className="text-center font-mono text-sm uppercase tracking-[0.14em] text-background/90 sm:text-base">
            Proven at Seven2: 19 participants. 19 projects. 100% shipped.
            About two and a half weeks, between client work.
          </p>
        </div>
      </section>

      {/* A Different Way to Adopt AI */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            A Different Way to Adopt AI
          </h2>
          <div className="mt-8 space-y-6 font-serif text-xl leading-snug text-foreground sm:text-2xl">
            <p>
              Companies don&apos;t adopt AI.
              <span className="block italic">People do.</span>
            </p>
            <p className="text-[var(--text-secondary)]">
              People don&apos;t become confident by watching someone else use
              AI.
            </p>
            <p>They become confident by creating.</p>
            <p className="text-[var(--text-secondary)]">
              Hacks-a-Thon gives employees a guided path to build something
              real.
            </p>
            <p className="text-[var(--text-secondary)]">
              People don&apos;t leave with more information.
            </p>
            <p>They leave with confidence.</p>
          </div>
          <div className="mt-10">
            <SeeHowItWorksButton />
          </div>
        </div>
      </section>

      {/* Designed to Create Real AI Adoption */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Designed to Create Real AI Adoption
          </h2>
          <div className="mt-8 max-w-[640px] space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              People build confidence fastest when they create something they
              genuinely care about.
            </p>
            <p>
              That&apos;s why we encourage participants to begin with something
              they genuinely want to create.
            </p>
            <p>
              That first success changes how they think about what they can do
              with AI.
            </p>
            <p>
              Before long, they&apos;re seeing opportunities to use AI
              everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* What Participants Discover */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            What Participants Discover
          </h2>
          <div className="mt-8 space-y-6 font-serif text-xl leading-snug sm:text-2xl">
            <p className="text-[var(--text-secondary)]">
              People come into Hacks-a-Thon expecting to learn about AI.
            </p>
            <p className="text-[var(--text-secondary)]">
              They leave with something much more valuable.
            </p>
            <p>They discover they can create.</p>
            <p className="text-[var(--text-secondary)]">
              They discover they&apos;re capable of solving problems they never
              thought they could.
            </p>
            <p className="text-[var(--text-secondary)]">
              And they discover AI isn&apos;t just another tool.
            </p>
            <p className="italic">It&apos;s a creative partner.</p>
          </div>
        </div>
      </section>

      {/* Participant Reflections */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Participant Reflections
          </h2>
          <div className="mt-10 space-y-10">
            {reflections.map((r) => (
              <figure
                key={r.attribution}
                className="border-l-2 border-primary/40 pl-6"
              >
                <blockquote className="font-serif text-xl italic leading-snug text-foreground sm:text-2xl">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <figcaption className="mono-label mt-3">
                  {r.attribution}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* The Outcome */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            The Outcome
          </h2>
          <div className="mt-8 space-y-6 font-serif text-xl leading-snug sm:text-2xl">
            <p>
              The biggest outcome isn&apos;t what people build.
              <span className="block italic">
                It&apos;s what they believe they can build next.
              </span>
            </p>
            <p className="text-[var(--text-secondary)]">
              That confidence doesn&apos;t disappear when the program ends.
            </p>
            <p className="text-[var(--text-secondary)]">
              People continue creating.
            </p>
            <p className="text-[var(--text-secondary)]">
              People continue experimenting.
            </p>
            <p className="text-[var(--text-secondary)]">
              People continue seeing opportunities to use AI in their everyday
              work.
            </p>
            <p>
              Over time, companies don&apos;t just adopt AI.
              <span className="block">
                They build a culture where creating with AI becomes part of how
                people solve problems.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Ready to Create Real AI Adoption?
          </h2>
          <div className="mx-auto mt-6 max-w-xl space-y-1 font-serif text-lg text-[var(--text-secondary)] sm:text-xl">
            <p>Give your team more than AI training.</p>
            <p className="text-foreground">
              Give them the confidence to create with AI.
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <SeeHowItWorksButton />
          </div>
        </div>
      </section>
    </div>
  );
}
