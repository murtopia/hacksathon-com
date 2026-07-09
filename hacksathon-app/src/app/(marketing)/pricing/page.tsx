import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Pricing - locked copy from site-copy-final-for-cursor.md (2026-07-07).
 * The copy is final and implemented verbatim; do not reword or add
 * sections. Layout only here.
 */

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "$995 for up to 25 people, $30 per additional participant up to 50. One flat price, everything included, no subscription.",
};

const afterPurchaseFlow = [
  "Buy your event",
  "Meet the Hacky Helper",
  "Invite your team",
  "Schedule the blocks",
  "Run it and showcase",
];

const featureGroups = [
  {
    label: "For your team",
    features: [
      "Full 10-block event format",
      "The IdeaLab: idea submission and shared gallery",
      "The Blueprint: guided AI planning conversation that produces a build-ready plan",
      "Auto-generated Starter Prompt tuned to your build tool",
      "Bring your own AI build tool: Lovable, Cursor, v0, Replit, and more",
      "Shark Tank, Minus the Sharks pitch sessions",
      "Time-blocked build sessions with the Blueprint + Starter Prompt handoff",
      "Hacky Awards voting and ceremony",
      "Reflections survey with guided prompts",
    ],
  },
  {
    label: "For the admin",
    features: [
      "Hacky Helper: guided, step-by-step event setup",
      "Admin Dashboard with block controls and participant management",
      "Team chat link: one place for your Slack, Discord, or Teams URL",
      "Branded email invites and notifications",
      "Auto-generated awards ceremony slideshow",
      "AI-generated reflection recap",
      "Your own vanity URL (hacksathon.com/yourteam)",
      "Public Showcase page: recap, projects, winners, and reflections",
      "Custom branding with your company logo",
    ],
  },
];

const breakpoints = [
  { participants: "Up to 25", price: "$995", perPerson: "~$39.80" },
  { participants: "30", price: "$1,145", perPerson: "~$38.17" },
  { participants: "40", price: "$1,445", perPerson: "~$36.13" },
  { participants: "50", price: "$1,745", perPerson: "~$34.90" },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-[var(--container-narrow)] px-4">
        {/* Hero header */}
        <header className="mb-12 space-y-2">
          <p className="mono-label">Pricing</p>
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Simple Flat Rate Pricing
          </h1>
          <p className="lead">
            Just one price for your entire team and no recurring or
            subscription fees to worry about.
          </p>
        </header>

        {/* Hero pricing */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <span className="font-heading text-7xl md:text-8xl tracking-tight">
              $995
            </span>
          </div>
          <p className="text-xl text-[var(--text-secondary)] mb-2">
            for up to 25 people
          </p>
          <p className="text-[var(--text-tertiary)]">
            $30 per additional participant, up to 50.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <Button variant="pill" size="pill" className="px-8 text-base" asChild>
            <Link href="/checkout">Buy Your Hacks-a-Thon</Link>
          </Button>
          <p className="text-sm text-[var(--text-tertiary)]">
            Purchase now, then set everything up with the Hacky Helper.
          </p>
        </div>

        {/* After purchase mini-flow */}
        <div className="mb-16">
          <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {afterPurchaseFlow.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span>{step}</span>
                {i < afterPurchaseFlow.length - 1 && (
                  <span aria-hidden className="opacity-60">
                    &rarr;
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* 51+ callout */}
        <div className="text-center mb-20 py-8 border-y border-[var(--border-default)]">
          <p className="text-[var(--text-secondary)] mb-3">
            Running this for more than 50 people?
          </p>
          <Button variant="outline" asChild>
            <Link href="mailto:support@hacksathon.com">Let&apos;s talk</Link>
          </Button>
          <p className="mt-3 text-sm text-[var(--text-tertiary)]">
            Larger events and multi-team rollouts welcome.
          </p>
        </div>

        {/* Team size breakpoints */}
        <div className="mb-20">
          <h4 className="mb-4 text-center">Team Size Breakpoints</h4>
          <div className="max-w-sm mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[var(--text-tertiary)]">
                  <th className="pb-2 text-left font-medium">Participants</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Per person</th>
                </tr>
              </thead>
              <tbody>
                {breakpoints.map((bp) => (
                  <tr
                    key={bp.participants}
                    className="border-b border-[var(--border-default)] last:border-0"
                  >
                    <td className="py-2.5 text-[var(--text-primary)]">
                      {bp.participants}
                    </td>
                    <td className="py-2.5 text-right font-medium text-[var(--text-primary)]">
                      {bp.price}
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-tertiary)]">
                      {bp.perPerson}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why One Flat Price */}
        <div className="mb-20">
          <h2 className="text-center mb-8">Why One Flat Price</h2>
          <div className="max-w-xl mx-auto space-y-5 text-[var(--text-secondary)] leading-relaxed">
            <p>
              Because the alternative is worse. Per-seat pricing punishes you
              for inviting the whole team, and the whole team is the point.
              Subscriptions charge you long after the event ends. One flat
              price means one decision, one line on the expense report, and no
              math about who&apos;s &ldquo;worth&rdquo; including. Invite the
              front desk. Invite the founders. It costs the same.
            </p>
            <p>
              For up to 25 people, that works out to about $40 a person for
              the full multi-week program: the guided blocks, the platform,
              the awards, all of it. Most teams spend more than that on the
              pizza.
            </p>
          </div>
        </div>

        {/* What's included */}
        <div className="mb-20">
          <h2 className="text-center mb-8">Everything Included. Every Event.</h2>
          <p className="text-center text-[var(--text-secondary)] mb-10 max-w-lg mx-auto">
            No feature gates between sizes. A team of 10 gets the exact same
            platform as a team of 50.
          </p>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-10 max-w-2xl mx-auto">
            {featureGroups.map((group) => (
              <div key={group.label}>
                <h3 className="mono-label mb-4">{group.label}</h3>
                <ul className="space-y-3">
                  {group.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]"
                    >
                      <span className="text-[var(--text-primary)] mt-0.5 shrink-0">
                        &#10003;
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Common Questions */}
        <div className="mb-16">
          <h2 className="text-center mb-10">Common Questions</h2>
          <div className="space-y-8 max-w-xl mx-auto">
            <div>
              <h3 className="mb-2 text-xl">
                What&apos;s included in a Hacks-a-Thon?
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Everything. Every Hacks-a-Thon gets the complete platform: all
                10 blocks, the Hacky Helper setup guide, the Blueprint and
                Starter Prompt, Hacky Awards, reflections with an AI recap,
                and your branding. The only variable is how many people you
                invite.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl">How much time does this take?</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Ten short blocks, 15 to 60 minutes each. Most teams spread
                them across a couple of weeks; some compress into one. You set
                the schedule, and the program fits around real work.{" "}
                <Link
                  href="/the-program"
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                >
                  See the full program &rarr;
                </Link>
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl">How does buying work?</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                You purchase your event up front, then set everything up. The
                Hacky Helper walks you through identity, schedule, your team,
                awards, and reflections step by step. Have a promo code? Enter
                it at checkout.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl">Is facilitation included?</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                The platform is the facilitator. The Hacky Helper walks you
                through setup step by step, every block carries
                participant-facing instructions and purpose, and the whole
                format is structured to run without outside help. You run it.
                That&apos;s the point.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl">
                Couldn&apos;t we just do this ourselves?
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Yep, you could. That&apos;s how this started, and it took
                months of design, a pile of custom tools, and a full pilot to
                get a version where everyone actually finishes. That&apos;s
                what you&apos;re buying: the guided blocks that remove every
                reason to stall, the Blueprint planning that keeps projects
                from collapsing, the Hacky Helper running the checklist, and
                the pitches, awards, and showcase that turn &ldquo;I&apos;ll
                try&rdquo; into &ldquo;I shipped.&rdquo; A shared doc and a
                demo day can start an event. This one finishes.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl">Is the AI build tool included?</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                No. Your price covers the Hacks-a-Thon platform. The AI build
                tools your team uses to actually build (Lovable, Cursor, v0,
                Replit, Google AI Studio, and others) are separate products,
                and many teams already have one through their company plan.
                You pick a default (or let participants choose their own)
                during setup.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center pt-8 border-t border-[var(--border-default)]">
          <h2 className="mb-3">Ready to run your Hacks-a-Thon?</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Buy your event, then set it up in minutes with the Hacky Helper.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="pill" size="pill" className="px-8" asChild>
              <Link href="/checkout">Buy Your Hacks-a-Thon</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/seven2">Read the Seven2 story</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
