"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAdminNavItems } from "@/components/event-nav/sections";
import { cn } from "@/lib/utils";

interface AdminSubnavProps {
  slug: string;
}

/**
 * Admin section sub-navigation (00-06). Promoted into the secondary-nav
 * slot directly beneath the top bar via `EventSecondaryNav`, replacing
 * the participant nav while inside `/[slug]/admin`.
 *
 * Each tab carries a mono numeric prefix (00-06) to reinforce the linear
 * walk-through; the prefix is rendered in foreground color so it reads
 * as a deliberate index, not as decoration.
 *
 * Desktop-only: below `md` the top bar's `EventMobileNav` hamburger
 * lists these same sections, so the back office has a single mobile menu.
 */
export function AdminSubnav({ slug }: AdminSubnavProps) {
  const pathname = usePathname();
  const items = getAdminNavItems(slug);

  return (
    <nav
      aria-label="Admin sections"
      className="hidden border-b bg-background md:block"
    >
      <div className="mx-auto flex w-full max-w-[var(--container-default)] gap-6 overflow-x-auto px-4 py-3">
        {items.map((item) => {
          const isActive = item.isActive(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-xs uppercase tracking-wide transition-colors duration-150",
                isActive
                  ? "text-foreground"
                  : "text-[var(--text-tertiary)] hover:text-foreground",
              )}
            >
              {item.number && (
                <span
                  aria-hidden
                  className="font-mono tabular-nums text-foreground"
                >
                  {item.number}
                </span>
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
