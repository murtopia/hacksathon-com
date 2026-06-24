import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminNavItems } from "@/components/event-nav/sections";

/**
 * Bottom-of-page forward navigation for the admin setup tabs (01-06).
 *
 * The Hacky Helper checklist deep-links into each setup tab, but the tabs
 * themselves had no way forward, so admins finished a page and felt
 * stranded (usability feedback). This renders a quiet footer: "Back to
 * Hacky Helper" plus "Continue to {NN Label}" for the next tab in journey
 * order. After the last tab (06 Reflections) the primary action loops
 * back to the checklist.
 *
 * Additive only - it does not touch the per-section Save buttons.
 */
export function AdminStepNav({
  slug,
  current,
}: {
  slug: string;
  /** Two-digit step number of the current page, e.g. "01". */
  current: string;
}) {
  const items = getAdminNavItems(slug);
  const helper = items[0];
  const idx = items.findIndex((i) => i.number === current);
  const next =
    idx >= 0 && idx < items.length - 1 ? items[idx + 1] : helper;
  const nextIsHelper = next.href === helper.href;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={helper.href}>
          <ArrowLeft className="size-3" />
          Back to Hacky Helper
        </Link>
      </Button>
      <Button asChild variant="pill" size="pill">
        <Link href={next.href}>
          {nextIsHelper
            ? "Finish - back to Hacky Helper"
            : `Continue to ${next.number} ${next.label}`}
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
