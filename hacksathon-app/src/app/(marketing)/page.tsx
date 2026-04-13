import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Proven Playbook",
    description:
      "A structured, time-blocked format from kickoff to showcase. Every phase is designed to move participants from idea to live demo.",
  },
  {
    title: "AI-Powered Ideation",
    description:
      "Built-in IdeaLab where participants brainstorm, submit, and refine ideas with AI assistance for competitive analysis and feature prioritization.",
  },
  {
    title: "Documentation Assistant",
    description:
      "A conversational AI guide that walks participants through creating project briefs, features, user flows, design guides, and tech stack docs.",
  },
  {
    title: "Rich Document Editor",
    description:
      "A WYSIWYG markdown editor for polishing documentation, with auto-save, export to multiple formats, and shareable public links.",
  },
  {
    title: "Blind Voting & Awards",
    description:
      "Configurable award categories with a blind ballot system. Fair, transparent, and exciting. Announce winners live from the admin dashboard.",
  },
  {
    title: "Reflections & Case Study",
    description:
      "Capture participant learnings with structured reflection questions. Feature the best quotes. Auto-generate a case study from your event.",
  },
];

const stats = [
  { value: "13", label: "Live Prototypes Built" },
  { value: "2-3", label: "Weeks, Start to Finish" },
  { value: "100%", label: "Participation Rate" },
  { value: '12/12', label: "Said It Was Easier Than Expected" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            Built from a real hackathon. Tested on real non-technical teams.
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Run a world-class hackathon at your company
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The turnkey platform for structured, AI-powered hackathons. From
            ideation to showcase, everything your team needs to build something
            real — no coding experience required.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Start Your Hackathon</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-study">See the Seven2 Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <blockquote className="text-2xl md:text-3xl font-serif italic text-muted-foreground">
            &ldquo;We&apos;re all just hacks. And that&apos;s kind of the point.&rdquo;
          </blockquote>
          <p className="mt-6 text-muted-foreground">
            Success is defined by participation, momentum, and growth — not
            perfection. Hacksathon.com is designed for creative teams, project
            managers, designers, and strategists who have never written a line of
            code.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need, integrated</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Five purpose-built tools woven into one seamless experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title}>
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
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-10">What participants said</h2>
          <div className="space-y-8">
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;Hacks-a-thon definitely proved that anyone can make an app or
              website using current AI and vibe coding platforms.&rdquo;
              <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                — Adam Simons, Seven2
              </footer>
            </blockquote>
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;I have definitely found myself thinking in response to every
              problem I have recently, &apos;oh I could make a solution for
              that&apos; rather than &apos;someone should make an app for that.&apos;&rdquo;
              <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                — Sena Lauer, Seven2
              </footer>
            </blockquote>
            <blockquote className="text-lg italic text-muted-foreground">
              &ldquo;If you have a vision, you can build it. This is such an easy
              process.&rdquo;
              <footer className="mt-2 text-sm font-medium text-foreground not-italic">
                — Christina Williams, Seven2
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to run your hackathon?</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Set up your event in minutes. Invite your team. Watch them build
            things they never thought possible.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
