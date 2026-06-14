"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getEventNavItems } from "@/components/event-nav/sections";
import { cn } from "@/lib/utils";

interface ParticipantNavProps {
  slug: string;
  isAdmin: boolean;
}

/**
 * Secondary navigation bar shown on every member-facing slug page.
 *
 * Highlights the active link based on the current pathname. Admins get
 * an additional "Admin" link at the end. The bar is sticky below the
 * platform top bar so participants can hop between sections without
 * scrolling back to the top.
 *
 * Desktop-only: below `md` the top bar's `EventMobileNav` hamburger
 * takes over so the sections never overflow off-screen on phones.
 */
export function ParticipantNav({ slug, isAdmin }: ParticipantNavProps) {
  const pathname = usePathname();
  const base = `/${slug}`;
  const items = getEventNavItems(slug, isAdmin);

  return (
    <nav
      aria-label="Event sections"
      className="sticky top-[var(--header-height)] z-40 hidden border-b bg-background md:block"
    >
      <div className="mx-auto flex w-full max-w-[var(--container-default)] gap-6 overflow-x-auto px-4 py-3">
        {items.map((item) => {
          const isActive = item.match(pathname, base);
          const isAdminLink = item.label === "Hacky Admin";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap font-medium text-xs uppercase tracking-wide transition-colors duration-150",
                isActive
                  ? "text-foreground"
                  : "text-[var(--text-tertiary)] hover:text-foreground",
                isAdminLink && "ml-auto",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
