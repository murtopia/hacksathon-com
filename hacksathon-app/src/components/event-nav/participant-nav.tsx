"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ParticipantNavProps {
  slug: string;
  isAdmin: boolean;
}

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string, base: string) => boolean;
}

/**
 * Secondary navigation bar shown on every member-facing slug page.
 *
 * Highlights the active link based on the current pathname. Admins get
 * an additional "Admin" link at the end. The bar is sticky below the
 * platform top bar so participants can hop between sections without
 * scrolling back to the top.
 */
export function ParticipantNav({ slug, isAdmin }: ParticipantNavProps) {
  const pathname = usePathname();
  const base = `/${slug}`;

  const items: NavItem[] = [
    {
      href: base,
      label: "Home",
      match: (p, b) => p === b,
    },
    {
      href: `${base}/idea`,
      label: "Your Idea",
      match: (p, b) => p.startsWith(`${b}/idea`),
    },
    {
      href: `${base}/blocks`,
      label: "The Blocks",
      match: (p, b) => p.startsWith(`${b}/blocks`),
    },
    {
      href: `${base}/idealab`,
      label: "IdeaLab",
      match: (p, b) => p.startsWith(`${b}/idealab`),
    },
    {
      href: `${base}/awards`,
      label: "Hacky Awards",
      match: (p, b) => p.startsWith(`${b}/awards`),
    },
    {
      href: `${base}/reflections`,
      label: "Reflections",
      match: (p, b) => p.startsWith(`${b}/reflections`),
    },
  ];

  if (isAdmin) {
    items.push({
      href: `${base}/admin`,
      label: "Hacky Admin",
      match: (p, b) => p.startsWith(`${b}/admin`),
    });
  }

  return (
    <nav
      aria-label="Event sections"
      className="sticky top-[var(--header-height)] z-40 border-b bg-background"
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
