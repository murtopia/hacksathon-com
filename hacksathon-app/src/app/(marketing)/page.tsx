import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const heroMeta = [
  { label: "Duration", value: "1-3 Weeks" },
  { label: "Platform", value: "You Choose" },
  { label: "Format", value: "Solo Builds" },
  { label: "Participation", value: "Anyone" },
];

const features = [
  {
    title: "Proven Playbook",
    description:
      "A structured, time-blocked format from kickoff to showcase. Every phase is designed to move participants from idea to live demo.",
  },
  {
    title: "IdeaLab",
    description:
      "One shared space where everyone submits their idea, tracks its progress from concept to live link, and sees what the rest of the team is building.",
  },
  {
    title: "Guided Blueprint",
    description:
      "A guided AI conversation that turns a rough idea into a build-ready Blueprint and a copy-paste starter prompt - everything they need to start building in the AI tool of their choice.",
  },
  {
    title: "Hacky Awards",
    description:
      "Custom award categories and a team vote where the winners stay hidden until you reveal them live in a full-screen awards ceremony.",
  },
  {
    title: "Reflections & Recap",
    description:
      "Collect structured reflections, then let AI synthesize them into an approved recap - published on the public showcase alongside the winners, every project, and standout quotes.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero - editorial port of hacks.murtopolis.com */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mono-label mb-5">
            Built from a real Hacks-a-Thon. Tested on real non-technical teams.
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Run a world-class Hacks-a-Thon at your company
          </h1>
          <p className="mt-6 max-w-2xl font-serif text-xl italic leading-snug text-[var(--text-secondary)] sm:text-2xl lg:text-3xl">
            A turnkey platform for running a structured, AI-powered Hacks-a-Thon.
            It takes your team from idea to a real, working app in short,
            time-blocked sessions over a few weeks, not one long day, so it fits
            around everyone&apos;s schedule. No coding experience required.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 border-y py-5 sm:grid-cols-4">
            {heroMeta.map((item) => (
              <div key={item.label}>
                <span className="block font-mono text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  {item.label}
                </span>
                <span className="mt-1 block font-serif text-lg">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-[640px] space-y-5">
            <p className="font-serif text-2xl italic leading-snug text-foreground sm:text-3xl">
              We&apos;re all just hacks. And that&apos;s kind of the point.
            </p>
            <p className="font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
              We&apos;re calling this a Hacks-a-Thon for a reason: nobody&apos;s
              pretending to be an expert developer (except the few who actually
              are), and it&apos;s okay to be a hack. Our Hacks-a-Thon is a focused,
              time-blocked program that helps everyone on your team learn to build
              with AI. It runs in short sessions that you define, spread across a
              few weeks, so it fits around real work instead of taking over a whole
              day.
            </p>
            <p className="font-serif text-lg leading-relaxed text-[var(--text-secondary)]">
              All you need is an idea, curiosity, and a willingness to try.
              Hacksathon.com is designed for everyone across your whole
              organization, from marketing to operations to HR, who has never
              written a line of code.
            </p>
          </div>

          <figure className="mt-10 max-w-[640px] border-l-2 border-primary/40 pl-6">
            <blockquote className="font-serif text-xl italic leading-snug text-foreground sm:text-2xl">
              &ldquo;The single most impactful thing we&apos;ve done for AI
              literacy. Now my team approaches everything with an AI-first
              mindset.&rdquo;
            </blockquote>
            <figcaption className="mono-label mt-3">
              Nick Murto, Co-Founder of Seven2
            </figcaption>
          </figure>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button variant="pill" size="pill" asChild>
              <Link href="/checkout">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-study">See the Seven2 Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl">Everything you need, integrated</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Five purpose-built tools woven into one seamless experience.
            </p>
          </div>
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 text-center">
          <h2 className="text-3xl mb-10">What participants said</h2>
          <div className="space-y-8">
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;Hacks-a-thon definitely proved that anyone can make an app or
              website using current AI and vibe coding platforms.&rdquo;
              <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                - Adam Simons, Seven2
              </footer>
            </blockquote>
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;I have definitely found myself thinking in response to every
              problem I have recently, &apos;oh I could make a solution for
              that&apos; rather than &apos;someone should make an app for that.&apos;&rdquo;
              <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                - Sena Lauer, Seven2
              </footer>
            </blockquote>
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;If you have a vision, you can build it. This is such an easy
              process.&rdquo;
              <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                - Christina Williams, Seven2
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4 text-center">
          <h2 className="text-3xl">Ready to run your Hacks-a-Thon?</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Set up your event in minutes. Invite your team. Watch them build
            things they never thought possible.
          </p>
          <Button variant="pill" size="pill" className="mt-8" asChild>
            <Link href="/checkout">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
