import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Be the first to know when Hacksathon.com is ready to run your team's structured, AI-powered Hacks-a-Thon.",
  openGraph: {
    title: "Hacksathon.com - Join the Waitlist",
    description:
      "Be the first to know when Hacksathon.com is ready to run your team's structured, AI-powered Hacks-a-Thon.",
    type: "website",
  },
};

const PROOF_POINTS: { value: string; label: string }[] = [
  { value: "13", label: "Live prototypes" },
  { value: "100%", label: "Participation" },
  { value: "12/12", label: "“Easier than expected”" },
];

/**
 * Public waitlist landing page.
 *
 * Marketing-grade but focused: short hero, one card with the form, a
 * thin proof bar pulling the strongest numbers from the Seven2 case
 * study. The form itself handles validation, submit, and the
 * in-place thank-you state.
 *
 * Lives under the (marketing) route group so it inherits the shared
 * header/footer chrome.
 */
export default function WaitlistPage() {
  return (
    <div className="flex flex-col">
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 text-center">
          <Badge variant="secondary" className="mb-5">
            Early access
          </Badge>
          <h1 className="text-balance text-4xl tracking-tight sm:text-5xl">
            Be first when Hacksathon.com opens up.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            We&apos;re building the turnkey platform for structured,
            AI-powered Hacks-a-Thons at your company. Drop your details and
            we&apos;ll be in touch as soon as it&apos;s ready for your team.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto w-full max-w-xl px-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Join the waitlist</CardTitle>
            </CardHeader>
            <CardContent>
              <WaitlistForm />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            From a real Hacks-a-Thon at Seven2
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-6">
            {PROOF_POINTS.map((point) => (
              <div key={point.label} className="text-center">
                <div className="text-2xl font-bold sm:text-3xl">
                  {point.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {point.label}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/case-study"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Read the full Seven2 case study
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
