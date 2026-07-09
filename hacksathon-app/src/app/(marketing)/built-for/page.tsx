import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Built For - locked copy from site-copy-final-for-cursor.md
 * (2026-07-07), PAGE 4. The copy is final and implemented verbatim; do
 * not reword or add sections. Layout only here.
 */

export const metadata: Metadata = {
  title: "Built For",
  description:
    "Built for the teams nobody calls technical: project managers, account leads, analysts, coordinators, and the agencies they work in.",
};

export default function BuiltForPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">Built For</p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
            Built for the teams nobody calls &ldquo;technical.&rdquo;
          </h1>
          <p className="mt-8 max-w-[640px] font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Project managers. Account leads. Analysts. Coordinators. Office
            managers. Operations. The people closest to the actual work,
            who&apos;ve been told AI matters but never handed a real way in.
            If that sounds like your team, you&apos;re exactly who this was
            built for.
          </p>
        </div>
      </section>

      {/* Your Organization */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Your Organization
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Every organization has the same untapped resource: people who
              see problems all day and have quietly thought &ldquo;there
              should be a tool for that.&rdquo; They don&apos;t need to become
              developers. They need a structured, guided experience that
              proves they can already build. Hacks-a-Thon works wherever
              there&apos;s a team, a calendar, and a pile of ideas
              nobody&apos;s had permission to act on. Which is to say: it
              works at your organization.
            </p>
            <p>
              The format doesn&apos;t care what industry you&apos;re in.
              Confidence transfers. A team that ships passion projects in a
              couple of weeks comes back Monday looking at your workflows,
              your client requests, your internal bottlenecks, and seeing
              things they could fix.
            </p>
          </div>
        </div>
      </section>

      {/* Marketing & Creative Agencies */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Marketing &amp; Creative Agencies
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              This is where Hacks-a-Thon was born: inside a creative agency,
              with a team of producers, designers, writers, animators, and
              developers between client deadlines. So it&apos;s built around
              agency reality. Sessions are short enough to fit between
              deliverables, the format runs on creative energy, and the
              pitch-and-demo rhythm is one agency people take to instantly.
              Turns out people who present for a living give spectacular Shark
              Tank pitches.
            </p>
            <p>
              It&apos;s also built for agency skeptics. Plenty of creatives
              side-eye AI, and honestly, good: they should be protective of
              the craft. Hacks-a-Thon doesn&apos;t ask anyone to hand over
              their creative judgment. It shows them AI as a prototyping and
              problem-solving partner, and lets the experience make the
              argument. Skeptics left with their standards intact and a
              working app to their name.
            </p>
            <p>
              Then there&apos;s the business case. Your clients are already
              asking what your agency is doing with AI. &ldquo;We ran a
              program where our whole team ships with it&rdquo; is a very
              different answer than a slide about your AI philosophy. The same
              skills show up in the work: faster prototypes in pitches,
              internal tools that smooth production, a team that reaches for
              &ldquo;we could build that&rdquo; instead of &ldquo;we&apos;d
              have to scope that.&rdquo;
            </p>
            <p>
              And the shift outlasts the event. At the agency where this
              started, the tools kept coming long after demo day, internal
              helpers and fixes the team built entirely on their own. The team
              didn&apos;t just learn AI. They started thinking AI-first.
              That&apos;s the real product, and no workshop has ever delivered
              it.
            </p>
            <p>
              For a small shop, this is a whole-agency moment. Everyone in one
              event, top to bottom, building side by side. Agencies run on
              culture, and nothing builds it like watching your coworkers
              surprise themselves.
            </p>
          </div>
          <p className="mt-6">
            <Link
              href="/seven2"
              className="font-serif text-lg text-foreground underline underline-offset-4 hover:no-underline"
            >
              Read the Seven2 story &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Sound like your team?
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="pill" size="pill" className="px-8" asChild>
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/seven2">Read the Seven2 story</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
