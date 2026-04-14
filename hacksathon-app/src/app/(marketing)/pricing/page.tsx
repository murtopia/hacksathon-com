import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Hacksathon.com",
  description:
    "$995 for up to 25 people. The complete hackathon platform — no feature gates, no subscriptions.",
};

const included = [
  "Full 10-block event format",
  "Organizer Dashboard with event setup, block controls, and participant management",
  "IdeaLab with AI-assisted PRD generation and competitive analysis",
  "ZERO.Prmptr planning documentation module",
  "Shark Tank Pitch module",
  "Build Blocks with time-blocked session structure",
  "Reflection module with structured post-event survey",
  "Hacky Awards ceremony auto-generated from voting data",
  "Event Summary Report",
  "Resource Library with Design Direction Guide, Scope Guardian worksheet, and Starter Prompt templates",
  "Organizer coaching tips at every block",
  "Custom branding with your company logo and primary color",
];

const faqs = [
  {
    question: "What's included in every event?",
    answer:
      "Everything. Every event gets the complete platform — all 10 blocks, AI tools, awards, reflections, coaching layer, branding, and reporting. The only variable is how many people you invite.",
  },
  {
    question: "Can I try it before buying?",
    answer:
      "Yes. The Organizer Demo Environment lets you create a free account, configure a complete event, and preview every participant-facing screen — with no time limit and no credit card required. You pay when you're ready to invite participants and launch your event.",
  },
  {
    question: "Is facilitation included?",
    answer:
      "The platform is the facilitator. Every block includes built-in coaching tips for the Organizer, participant-facing instructions, and a structured format designed to run without outside help. You run it. That's the point.",
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
        {/* Hero pricing */}
        <div className="text-center mb-16">
          <h4 className="mb-6">Pricing</h4>
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
        <div className="flex flex-col items-center gap-3 mb-16">
          <Button size="lg" className="px-8 text-base" asChild>
            <Link href="/signup">Set Up Your Event</Link>
          </Button>
          <p className="text-sm text-[var(--text-tertiary)]">
            Configure your event free. Pay when you&apos;re ready to launch.
          </p>
        </div>

        {/* 51+ callout */}
        <div className="text-center mb-20 py-8 border-y border-[var(--border-default)]">
          <p className="text-[var(--text-secondary)] mb-3">
            Running this for more than 50 people?
          </p>
          <Button variant="outline" asChild>
            <Link href="mailto:nick@murtopolis.com">Let&apos;s talk</Link>
          </Button>
        </div>

        {/* Price breakpoints — small supporting note */}
        <div className="mb-20">
          <h4 className="mb-4 text-center">Team size breakpoints</h4>
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

        {/* What's included */}
        <div className="mb-20">
          <h2 className="text-center mb-8">
            Everything included. Every event.
          </h2>
          <p className="text-center text-[var(--text-secondary)] mb-10 max-w-lg mx-auto">
            No feature gates between sizes. A team of 10 gets the exact same
            platform as a team of 50.
          </p>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3 max-w-2xl mx-auto">
            {included.map((feature) => (
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

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-center mb-10">Common questions</h2>
          <div className="space-y-8 max-w-xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="mb-2 text-xl">{faq.question}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8 border-t border-[var(--border-default)]">
          <h2 className="mb-3">Ready to run your hackathon?</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Set up your event in minutes. Pay when you&apos;re ready to launch.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="px-8" asChild>
              <Link href="/signup">Set Up Your Event</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/case-study">See the Seven2 Story</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
