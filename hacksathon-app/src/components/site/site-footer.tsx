import Link from "next/link";
import { PromptCaret } from "@/components/site/prompt-caret";

const navLinkClass =
  "text-muted-foreground transition-colors hover:text-foreground";

/**
 * The single, shared site footer used across every surface - marketing
 * pages, the public wrap-up, and the signed-in app. Horizontal layout:
 * wordmark + "A Murtopolis Venture" on the left, nav in the middle,
 * copyright on the right; stacks on mobile.
 */
export function SiteFooter() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto w-full max-w-[var(--container-default)] px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-bold transition-colors hover:text-foreground"
            >
              <PromptCaret className="h-3 w-auto" />
              Hacksathon.com
            </Link>
            <a
              href="https://murtopolis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              A Murtopolis Venture
            </a>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/about" className={navLinkClass}>
              About
            </Link>
            <Link href="/seven2" className={navLinkClass}>
              Seven2 Case Study
            </Link>
            <Link href="/support" className={navLinkClass}>
              Contact
            </Link>
            <Link href="/privacy" className={navLinkClass}>
              Privacy
            </Link>
            <Link href="/terms" className={navLinkClass}>
              Terms
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Murtopolis, LLC
          </p>
        </div>
      </div>
    </footer>
  );
}
