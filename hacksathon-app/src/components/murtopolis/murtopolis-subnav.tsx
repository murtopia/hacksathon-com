"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  /** Mono numeric prefix shown to the left of the label, e.g. "01". */
  number: string;
  label: string;
  match: (pathname: string) => boolean;
  /**
   * Opens in a new tab via a plain anchor rather than a Next `<Link>`.
   * External items are never marked active.
   */
  external?: boolean;
}

const BASE = "/murtopolis";

// PostHog project dashboard (set NEXT_PUBLIC_POSTHOG_DASHBOARD_URL to the
// project's Web Analytics URL). Omitted from the nav until configured so we
// never render a dead "Analytics" link.
const POSTHOG_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_POSTHOG_DASHBOARD_URL?.trim() || null;

const items: NavItem[] = [
  {
    href: BASE,
    number: "00",
    label: "Overview",
    match: (p) => p === BASE,
  },
  {
    href: `${BASE}/customers`,
    number: "01",
    label: "Customers",
    match: (p) => p.startsWith(`${BASE}/customers`),
  },
  {
    href: `${BASE}/revenue`,
    number: "02",
    label: "Revenue",
    match: (p) => p.startsWith(`${BASE}/revenue`),
  },
  {
    href: `${BASE}/users`,
    number: "03",
    label: "Users",
    match: (p) => p.startsWith(`${BASE}/users`),
  },
  {
    href: `${BASE}/waitlist`,
    number: "04",
    label: "Waitlist",
    match: (p) => p.startsWith(`${BASE}/waitlist`),
  },
  {
    href: `${BASE}/emails`,
    number: "05",
    label: "Emails",
    match: (p) => p.startsWith(`${BASE}/emails`),
  },
  ...(POSTHOG_DASHBOARD_URL
    ? [
        {
          href: POSTHOG_DASHBOARD_URL,
          number: "06",
          label: "Analytics",
          match: () => false,
          external: true,
        } satisfies NavItem,
      ]
    : []),
];

/**
 * Platform-owner (Murtopolis) sub-navigation. Mirrors the per-event
 * AdminSubnav treatment - horizontal scroll row, mono numeric prefix,
 * foreground active state - so the owner console reads as the same
 * product family as the event admin, just one level up.
 */
export function MurtopolisSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Murtopolis sections"
      className="flex gap-6 overflow-x-auto border-b py-3"
    >
      {items.map((item) => {
        const isActive = item.match(pathname);
        const className = cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-xs uppercase tracking-wide transition-colors duration-150",
          isActive
            ? "text-foreground"
            : "text-[var(--text-tertiary)] hover:text-foreground",
        );
        const inner = (
          <>
            <span aria-hidden className="font-mono tabular-nums text-foreground">
              {item.number}
            </span>
            <span>{item.label}</span>
          </>
        );

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {inner}
            </a>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={className}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
