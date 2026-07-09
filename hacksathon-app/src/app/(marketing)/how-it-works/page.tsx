import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgramBlocksTimeline } from "@/components/site/program-blocks-timeline";

/**
 * How It Works - locked copy from site-copy-final-for-cursor.md
 * (2026-07-07), PAGE 3. The copy is final and implemented verbatim; do
 * not reword or add sections. Layout only here.
 */

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Why Hacks-a-Thon works: ownership, confidence, and culture. Ten short guided blocks take every participant from idea to a working build.",
};

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">How It Works</p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
            Confidence isn&apos;t taught. It&apos;s built.
          </h1>
          <div className="mt-8 max-w-[640px] space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Most AI training tries to transfer knowledge. Hacks-a-Thon does
              something different: it gives every person on your team the
              experience of taking an idea from &ldquo;what if&rdquo; to
              &ldquo;look what I made.&rdquo; That experience, not another
              lecture, is what changes how people think about AI.
            </p>
            <p className="text-foreground">Here&apos;s how it works.</p>
          </div>
        </div>
      </section>

      {/* Why Training Isn't Enough */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Why Training Isn&apos;t Enough
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              You&apos;ve seen it happen. The team sits through the AI
              workshop, nods along, maybe even gets excited. Two weeks later,
              nothing has changed. Not because the training was bad, but
              because watching builds awareness, and awareness isn&apos;t the
              problem.
            </p>
            <p>
              What your team is missing is a real reason to use AI. Not a
              sandbox exercise. A real project of their own, with a real
              finish line. The gap between &ldquo;I know AI is
              important&rdquo; and &ldquo;I know what to do with it&rdquo;
              doesn&apos;t close by adding information. It closes the first
              time someone builds something real.
            </p>
            <p>
              That&apos;s the entire premise: skip the lecture, engineer the
              first success. Awareness is where training stops. It&apos;s
              where Hacks-a-Thon starts. From there: ownership, confidence,
              culture.
            </p>
          </div>
        </div>
      </section>

      {/* Ownership */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Ownership
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Here&apos;s the part that surprises people: we encourage
              participants to build something personal. Not a work tool.
              Something they genuinely want to exist in the world.
            </p>
            <p>
              At Seven2, that meant a bedtime-story app a mom built for her
              kids. A coffee-tasting journal. A tool for deciding what to do
              when you can&apos;t decide anything. None of it was
              &ldquo;strategic.&rdquo; All of it got finished.
            </p>
            <p>
              That&apos;s the mechanism, not a warm-up lap. When someone
              builds their own idea, nobody has to manufacture motivation.
              We&apos;ve seen participants get so invested that they kept
              polishing their projects outside their scheduled sessions, not
              because anyone asked, but because they couldn&apos;t wait to see
              the next version. That excitement is what survives the hard
              parts: the stubborn bug, the prompt that won&apos;t cooperate,
              the moment they&apos;d rather quit. People push through
              differently for something they&apos;re proud of.
            </p>
            <p>
              Then Monday comes, and the person who shipped a bedtime-story
              app looks at a clunky work process and sees something they could
              fix. Personal projects aren&apos;t a detour from business value.
              They&apos;re the fastest road to it, because the confidence
              transfers even when the project doesn&apos;t.
            </p>
          </div>
        </div>
      </section>

      {/* Confidence */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Confidence
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Confidence isn&apos;t something you can talk a team into.
              It&apos;s the residue of doing a thing you didn&apos;t think you
              could do. So Hacks-a-Thon is engineered to make that happen on
              purpose, for every participant, through 10 guided blocks.
            </p>
          </div>

          <div className="my-12">
            <ProgramBlocksTimeline />
          </div>

          <div className="space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Each block exists to remove a reason to stall. Kickoff takes the
              intimidation out of the room. The IdeaLab gets ideas out of
              heads and into the open, where they start becoming real. The
              one-minute Shark Tank pitch does something quiet but powerful:
              once your team has heard your plan, you want to finish it. And
              before anyone touches a build tool, the Blueprint turns the idea
              into real documentation and a starter prompt, because the
              fastest way to lose a beginner is to hand them an empty prompt
              box and wish them luck.
            </p>
            <p>
              Then come the build sessions: short, time-blocked, protected on
              the calendar. Not marathon weekends. Real progress in the
              margins of real work. The multi-week rhythm is deliberate, too.
              A one-day sprint produces adrenaline. A few weeks of short
              sessions produce skill. Between sessions, ideas simmer, problems
              solve themselves in the shower, and people come back knowing
              exactly what they want to try next.
            </p>
            <p>
              The Showcase Showdown is the finish line that makes it all
              count: a three-minute demo in front of the whole team. Deadlines
              finish projects, and there&apos;s no deadline like your
              coworkers waiting to see what you made.
            </p>
            <p>
              Then, when the demos wrap, Reflections asks everyone to put the
              experience into their own words. It sounds like a small step. It
              isn&apos;t. Internalizing what you just did is how the learning
              sticks, and it&apos;s usually the moment people realize two
              things at once: this was easier than they expected, and they had
              a genuinely good time doing it.
            </p>
            <p>
              That confidence isn&apos;t a promise from a brochure. It&apos;s
              earned, and everyone in the room watched it happen.
            </p>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Culture
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              The culture shift doesn&apos;t wait for demo day. It starts at
              the Shark Tank pitches, which might be the most fun meeting your
              team has ever attended. People get into it: honing their
              one-minute pitch, playing to the room, selling an idea they
              invented a week ago. And once every idea is out in the open,
              something else kicks in. Teammates start trading feedback,
              unsticking each other&apos;s builds, cheering on projects that
              aren&apos;t theirs. The whole event runs on a
              we&apos;ve-got-your-back current, because everyone in it is a
              beginner at something.
            </p>
            <p>
              Then comes the room where the whole team demos what they made.
              Everyone watched everyone else start from nothing, so every demo
              lands as proof of what&apos;s suddenly possible for anyone in
              the company. The Hacky Awards turn that proof into shared
              memory: votes, categories, a ceremony, winners nobody saw
              coming. Traditional team building creates shared activity. This
              creates shared accomplishment, and people bond differently over
              something they struggled through and finished together.
            </p>
            <p>
              Then the event ends, and the real outcome shows up. People keep
              building. New tools appear, unprompted. Hallway conversations
              change. People stop asking whether AI matters and start
              comparing what they&apos;re building. That&apos;s the flywheel:
              one person creates, someone else thinks &ldquo;I could do
              that,&rdquo; and before long, creating is just how your team
              solves problems.
            </p>
            <p>
              Culture isn&apos;t a poster on the wall. It&apos;s what people
              do when nobody schedules it. That&apos;s the version of AI
              adoption that lasts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Ready to see what&apos;s inside?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-[var(--text-secondary)] sm:text-xl">
            You&apos;ve seen why it works. The Program page shows what you
            get: every piece, in the order your team will experience it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="pill" size="pill" className="px-8" asChild>
              <Link href="/the-program">See What&apos;s Included</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
