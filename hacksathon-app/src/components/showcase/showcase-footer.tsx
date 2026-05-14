import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShowcaseFooterProps {
  /** When true, render the marketing CTA inside its own banner section. */
  withCta?: boolean;
}

/**
 * The shared footer that closes every public showcase page (revealed
 * and teaser variants both). Designed as a soft conversion surface:
 * the visitor is already someone who *gets* hackathons (they came to
 * see one), so we earn the click with a one-line pitch and a single
 * primary button.
 */
export function ShowcaseFooter({ withCta = true }: ShowcaseFooterProps) {
  return (
    <>
      {withCta && (
        <section className="border-b bg-foreground text-background">
          <div className="container mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/70">
              Run your own
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Want to host a Hacks-a-Thon like this one?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-background/80 sm:text-lg">
              Hacksathon.com gives non-technical teams everything they need to
              run a 1-day hackathon — schedule, ideas, voting, awards,
              recap.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">
                  Start your Hacks-a-Thon
                  <ArrowRight className="ml-2 size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t bg-background">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>
            Powered by{" "}
            <Link
              href="/"
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Hacksathon.com
            </Link>
          </p>
          <div className="flex items-center gap-5">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/case-study" className="hover:text-foreground">
              Case study
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
