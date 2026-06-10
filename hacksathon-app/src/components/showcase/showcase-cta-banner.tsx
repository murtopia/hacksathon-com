import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The dark "run your own" conversion banner that sits above the footer on
 * public showcase pages. The visitor already gets the format (they came
 * to see one), so we earn the click with a one-line pitch and a single
 * primary button.
 */
export function ShowcaseCtaBanner() {
  return (
    <section className="border-b bg-foreground text-background">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4 py-16 text-center sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-background/70">
          Run your own
        </p>
        <h2 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
          Want to run a Hacks-a-Thon like this one?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-background/80 sm:text-lg">
          Hacksathon.com gives non-technical teams everything they need to run
          their own Hacks-a-Thon - schedule, ideas, voting, awards, and an AI
          recap.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/checkout">
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
  );
}
