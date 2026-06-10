"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminSubnavProps {
  slug: string;
  /**
   * Pending Hacky Helper required steps. When > 0, a small pill renders
   * next to the Hacky Helper link to remind the admin there's still
   * setup work waiting. Pass 0 from the layout (or omit) to hide it.
   */
  pendingSteps?: number;
}

interface NavItem {
  href: string;
  /** Mono numeric prefix shown to the left of the label, e.g. "01". */
  number?: string;
  label: string;
  match: (pathname: string) => boolean;
}

/**
 * Admin section sub-navigation. Sits below the participant nav inside
 * the admin layout and links the seven admin screens.
 *
 * Order mirrors the Hacky Helper journey: Identity → Integrations →
 * Schedule → Team → Awards → Reflections. The "00 Hacky Helper" tab
 * leads because that's where the Helper itself lives.
 *
 * Each tab carries a mono numeric prefix (00–06) to reinforce the
 * linear walk-through; the prefix is rendered in foreground color so it
 * reads as a deliberate index, not as decoration.
 */
export function AdminSubnav({ slug, pendingSteps = 0 }: AdminSubnavProps) {
  const pathname = usePathname();
  const base = `/${slug}/admin`;

  const items: NavItem[] = [
    {
      href: base,
      number: "00",
      label: "Hacky Helper",
      match: (p) => p === base,
    },
    {
      href: `${base}/identity`,
      number: "01",
      label: "Identity",
      match: (p) => p.startsWith(`${base}/identity`),
    },
    {
      href: `${base}/integrations`,
      number: "02",
      label: "Integrations",
      match: (p) => p.startsWith(`${base}/integrations`),
    },
    {
      href: `${base}/schedule`,
      number: "03",
      label: "Schedule",
      match: (p) => p.startsWith(`${base}/schedule`),
    },
    {
      href: `${base}/team`,
      number: "04",
      label: "Team",
      match: (p) => p.startsWith(`${base}/team`),
    },
    {
      href: `${base}/awards`,
      number: "05",
      label: "Hacky Awards",
      match: (p) => p.startsWith(`${base}/awards`),
    },
    {
      href: `${base}/reflections`,
      number: "06",
      label: "Reflections",
      match: (p) => p.startsWith(`${base}/reflections`),
    },
  ];

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-6 overflow-x-auto border-b py-3"
    >
      {items.map((item) => {
        const isActive = item.match(pathname);
        const isOverview = item.href === base;
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
            {isOverview && pendingSteps > 0 && (
              <span
                className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border px-1.5 font-mono text-[10px] font-semibold tabular-nums"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
                aria-label={`${pendingSteps} setup ${pendingSteps === 1 ? "step" : "steps"} left`}
              >
                {pendingSteps}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
