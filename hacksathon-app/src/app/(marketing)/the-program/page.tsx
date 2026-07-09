import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgramBlocksTimeline } from "@/components/site/program-blocks-timeline";

/**
 * The Program - locked copy from site-copy-final-for-cursor.md
 * (2026-07-07), PAGE 2. The copy is final and implemented verbatim; do
 * not reword or add sections. Layout only here.
 *
 * The "See It For Yourself" section holds embedded Arcade click-through
 * demos that are not yet built; it renders quiet placeholders until the
 * embeds exist (per the doc's production note).
 */

export const metadata: Metadata = {
  title: "The Program",
  description:
    "Everything inside a Hacks-a-Thon: the IdeaLab, the Blueprint, pitches, protected build sessions, demos, Hacky Awards, and a Public Showcase. One flat price.",
};

const whatYouGet = [
  {
    name: "Admin Dashboard.",
    body: "Mission control for your Hacks-a-Thon. Set up your event, invite your team, schedule the blocks, and watch progress roll in. The built-in Hacky Helper keeps a running checklist of every step from setup through event day, always pointing at what to do next. You don't have to be the expert in the room. The program already is.",
  },
  {
    name: "The IdeaLab.",
    body: "Every Hacks-a-Thon starts with ideas. The IdeaLab is where your team posts theirs: a shared gallery where everyone can see what everyone else is dreaming up. It's the first step from \u201cI have an idea\u201d to \u201cI'm building it,\u201d and watching the gallery fill up is when your team starts to believe this is really happening.",
  },
  {
    name: "The Blueprint.",
    body: "The bridge between a rough idea and a strong first prompt. The Blueprint is an AI-guided conversation that asks the right questions, helps each participant think through the details, and hands them complete project documentation plus a ready-to-paste starter prompt for their build tool. It surfaces the questions they hadn't thought to ask yet, so projects start strong instead of starting over.",
  },
  {
    name: "Shark Tank, Minus the Sharks.",
    body: "Before the building begins, everyone gets one minute to pitch their idea to the team, followed by light, constructive feedback. No big bites. It sharpens each idea, sparks collective energy, and does something quieter but more powerful: once your team has heard your pitch, you want to finish what you started. Expect a little showmanship.",
  },
  {
    name: "Protected build sessions.",
    body: "Short, time-blocked sessions that fit around real work. No marathon weekends, no all-nighters. Protected time on the calendar is what turns \u201cI'll get to it someday\u201d into steady, visible progress.",
  },
  {
    name: "Showcase Showdown.",
    body: "Demo day. Each builder gets three minutes to show what they made and two minutes of Q&A from the team. The moment \u201cI have an idea\u201d officially becomes \u201cI built this.\u201d",
  },
  {
    name: "Hacky Awards.",
    body: "The finale your team will talk about for months. Everyone votes across the award categories, then celebrates together in a click-through ceremony. Shared accomplishment is what turns one person's confidence into a team's culture.",
  },
  {
    name: "Reflections.",
    body: "After the demos, guided questions help each participant capture what surprised them, what they're proud of, and what they'll carry forward. You can tune the questions or add your own. Then AI weaves every answer into a recap of your team's whole experience: proof of how far they came, in their own words.",
  },
  {
    name: "Public Showcase.",
    body: "Every event gets its own page on Hacksathon.com. Flip one switch, and once winners are revealed, anyone can see your team's showcase: the winners, every idea, the AI recap. One scrollable page, no sign-in required, ready to share with leadership or the world. Prefer to keep it private? Leave the switch off and your event stays between your team.",
  },
];

export default function TheProgramPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">The Program</p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
            Give your team the confidence to create with AI.
          </h1>
          <div className="mt-8 max-w-[640px] space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Hacks-a-Thon is a guided program that helps employees move from
              AI curiosity to hands-on confidence through creating something
              real.
            </p>
            <p>
              Built around a proven framework, structured guidance, and a
              thoughtfully designed participant experience, Hacks-a-Thon helps
              organizations build AI confidence by helping employees discover
              new possibilities and turn ideas into real solutions.
            </p>
            <p>
              Whether someone is opening ChatGPT for the first time or already
              building with AI every day, the shared experience creates new
              ideas, stronger collaboration, and lasting momentum across your
              team.
            </p>
          </div>
          <div className="mt-10">
            <Button variant="pill" size="pill" asChild>
              <Link href="#what-you-get">Explore What&apos;s Included</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. What You Get */}
      <section
        id="what-you-get"
        className="scroll-mt-24 border-b py-20 bg-muted/30"
      >
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            What You Get
          </h2>
          <p className="mt-8 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Hacks-a-Thon is a guided program where every piece exists to do
            one thing: help your team build AI confidence by creating
            something real. Whether someone&apos;s writing their first prompt
            ever or already building with AI every day, the program meets them
            where they are and walks everyone through it, step by step.
            Here&apos;s what&apos;s inside, in the order your team will
            experience it.
          </p>

          <div className="mt-12 space-y-10">
            {whatYouGet.map((item) => (
              <div key={item.name}>
                <h3 className="font-serif text-2xl leading-snug text-foreground">
                  {item.name}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 border-l-2 border-primary/40 pl-6">
            <p className="text-base leading-relaxed text-[var(--text-secondary)]">
              <span className="font-semibold text-foreground">
                One thing to know:
              </span>{" "}
              participants build their projects in an AI creation tool like
              Lovable, which is separate from Hacks-a-Thon. Most have free
              tiers that work well for a first project, and the program is
              designed to work alongside whichever tool your organization
              chooses.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How Long Will This Take? */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            How Long Will This Take?
          </h2>
          <div className="mt-8 space-y-5 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            <p>
              Less than you&apos;d think. Hacks-a-Thon runs as 10 guided
              blocks, from Kickoff to Reflections, each one a short
              time-blocked session between 15 and 60 minutes. You set the
              dates, and the program fits around your team&apos;s real
              workload instead of competing with it. Most teams spread the
              blocks across a couple of weeks. Compress it into a single week,
              or leave breathing room between sessions so client work never
              skips a beat. That time in between isn&apos;t dead air.
              It&apos;s where ideas simmer and confidence builds.
            </p>
            <p>
              Bigger team? Shark Tank pitches and the Showcase Showdown can
              easily run as multiple sessions, so everyone gets their minute
              to pitch and their moment to demo.
            </p>
          </div>

          <div className="mt-12">
            <ProgramBlocksTimeline />
          </div>
        </div>
      </section>

      {/* 4. Born Inside a Real Agency */}
      <section className="border-b py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Born Inside a Real Agency
          </h2>
          <p className="mt-8 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            Hacks-a-Thon wasn&apos;t invented on a whiteboard. It was built
            and run inside Seven2, a creative agency, with a team of
            producers, designers, and strategists, almost none of whom had
            ever written code. They pitched, they built, they demoed, and they
            shipped real, working projects. Then something better happened:
            after the event ended, they kept creating.
          </p>
          <p className="mt-6">
            <Link
              href="/seven2"
              className="font-serif text-lg text-foreground underline underline-offset-4 hover:no-underline"
            >
              Read the full Seven2 story &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* 5. See It For Yourself */}
      <section className="border-b py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            See It For Yourself
          </h2>
          <p className="mt-8 font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
            The fastest way to understand Hacks-a-Thon is to see it in action.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-serif text-2xl leading-snug text-foreground">
                The Admin Experience.
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                Walk through setting up an event, scheduling the blocks, and
                running the show.
              </p>
              {/* Arcade click-through embed goes here once built. */}
              <div
                aria-hidden
                className="mt-5 flex aspect-video items-center justify-center rounded-lg border bg-muted/50"
              >
                <span className="mono-label">Interactive demo coming soon</span>
              </div>
            </div>
            <div>
              <h3 className="font-serif text-2xl leading-snug text-foreground">
                The Participant Journey.
              </h3>
              <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                See what your team sees, from posting an idea to the Blueprint
                to demo day.
              </p>
              {/* Arcade click-through embed goes here once built. */}
              <div
                aria-hidden
                className="mt-5 flex aspect-video items-center justify-center rounded-lg border bg-muted/50"
              >
                <span className="mono-label">Interactive demo coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            Your team already has the ideas.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-[var(--text-secondary)] sm:text-xl">
            Hacks-a-Thon gives them the confidence to build them. One flat
            price for your whole event. No subscription, no per-seat
            surprises.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="pill" size="pill" className="px-8" asChild>
              <Link href="/checkout">Buy Your Hacks-a-Thon</Link>
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
