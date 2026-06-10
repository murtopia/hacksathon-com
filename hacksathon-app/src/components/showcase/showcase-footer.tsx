import Link from "next/link";
import { ShowcaseCtaBanner } from "@/components/showcase/showcase-cta-banner";

interface ShowcaseFooterProps {
  /** When true, render the marketing CTA inside its own banner section. */
  withCta?: boolean;
}

/**
 * The shared footer that closes the `/[slug]` public showcase (revealed
 * and teaser variants both): the "run your own" CTA banner plus a slim
 * powered-by row.
 */
export function ShowcaseFooter({ withCta = true }: ShowcaseFooterProps) {
  return (
    <>
      {withCta && <ShowcaseCtaBanner />}

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-[var(--container-default)] flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
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
