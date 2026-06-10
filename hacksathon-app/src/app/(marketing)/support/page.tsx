import type { Metadata } from "next";
import { Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupportForm } from "@/components/support/support-form";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Questions about running a Hacks-a-Thon, pricing, or your account? Reach the Hacksathon.com team.",
  openGraph: {
    title: "Hacksathon.com - Support",
    description:
      "Questions about running a Hacks-a-Thon, pricing, or your account? Reach the Hacksathon.com team.",
    type: "website",
  },
};

const SUPPORT_EMAIL = "support@hacksathon.com";

const faqs = [
  {
    question: "What's included in every event?",
    answer:
      "Everything. Every event gets the complete platform - all 10 blocks, AI tools, awards, reflections, coaching layer, branding, and reporting. The only variable is how many people you invite.",
  },
  {
    question: "Is facilitation included?",
    answer:
      "The platform is the facilitator. Every block includes built-in coaching tips for the Organizer, participant-facing instructions, and a structured format designed to run without outside help. You run it. That's the point.",
  },
  {
    question: "Is the AI build tool included?",
    answer:
      "No. Your price covers the Hacksathon platform. The AI build tools your team uses to actually build - Lovable, Cursor, v0, Replit, Google AI Studio, and others - are separate products, and many teams already have one. You pick a default (or let participants choose their own) during setup.",
  },
  {
    question: "How quickly will I hear back?",
    answer:
      "We typically reply within one business day. Urgent issue during a live event? Mention it in your message and we'll prioritize it.",
  },
];

/**
 * Public support page.
 *
 * One page that combines a short About intro, direct contact info, the
 * support form, and a handful of FAQs lifted from the pricing page.
 * Lives under the (marketing) route group so it inherits the shared
 * header + footer chrome.
 */
export default function SupportPage() {
  return (
    <div className="flex flex-col">
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 text-center">
          <h1 className="text-balance text-4xl tracking-tight sm:text-5xl">
            We&apos;re here to help.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Hacksathon.com is a Murtopolis venture, born from the Seven2
            Hacks-a-Thon. Whether you&apos;re planning your first event, sorting
            out pricing, or running one right now, drop us a line and a real
            person will get back to you.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Prefer email?{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <Mail className="size-4" aria-hidden />
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto w-full max-w-xl px-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <SupportForm />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4">
          <h2 className="text-center text-2xl tracking-tight sm:text-3xl">
            Frequently asked
          </h2>
          <div className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3>{faq.question}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
