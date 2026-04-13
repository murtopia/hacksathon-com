import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Case Study — The Seven2 Hacks-a-Thon",
};

export default function CaseStudyPage() {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">
          The Seven2 Hacks-a-Thon
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          How a creative agency with zero developers built 13 working prototypes
          in 2 weeks using AI.
        </p>

        <div className="mt-12 space-y-12">
          <section>
            <h2 className="text-2xl font-bold">The Challenge</h2>
            <p className="mt-3 text-muted-foreground">
              Seven2 is a creative digital agency in Spokane, WA. Their team of
              ~22 people includes designers, strategists, content creators, and
              project managers — but very few programmers. The goal was to
              demystify AI-powered building and give every employee the
              experience of creating something real.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">The Structure</h2>
            <p className="mt-3 text-muted-foreground">
              The hackathon was structured into 8 time-blocked phases over 2-3
              weeks: kickoff, ideation, pitching, documentation, three build
              sessions, and a final showcase. Every phase had a clear purpose and
              checklist. Daily status check-ins maintained momentum.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">The Results</h2>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold">13</div>
                <div className="text-sm text-muted-foreground">
                  Working prototypes with live URLs
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">
                  Participation rate
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">32</div>
                <div className="text-sm text-muted-foreground">
                  Ideas submitted to IdeaLab
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">12/12</div>
                <div className="text-sm text-muted-foreground">
                  Said it was easier than expected
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold">What Participants Said</h2>
            <div className="mt-4 space-y-6">
              <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                &ldquo;Hacks-a-thon definitely proved that anyone can make an app
                or website using current AI and vibe coding platforms.&rdquo;
                <footer className="mt-1 text-sm font-medium text-foreground not-italic">
                  — Adam Simons
                </footer>
              </blockquote>
              <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                &ldquo;Just jump in. It&apos;s not even close to as daunting as it
                seems like it&apos;s going to be.&rdquo;
                <footer className="mt-1 text-sm font-medium text-foreground not-italic">
                  — Chris Hunter
                </footer>
              </blockquote>
              <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
                &ldquo;My process shifted from &apos;function-first&apos; to
                &apos;experience-first.&apos;&rdquo;
                <footer className="mt-1 text-sm font-medium text-foreground not-italic">
                  — Joe Moore
                </footer>
              </blockquote>
            </div>
          </section>

          <div className="pt-8 text-center">
            <Button size="lg" asChild>
              <Link href="/signup">Run Your Own Hackathon</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
