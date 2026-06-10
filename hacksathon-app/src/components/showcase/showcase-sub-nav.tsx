import Link from "next/link";

export interface ShowcaseNavItem {
  label: string;
  href: string;
}

interface ShowcaseSubNavProps {
  /** In-page anchor links for the wrap-up's sections. */
  navItems: ShowcaseNavItem[];
}

/**
 * The case-study / wrap-up section nav. Renders as a sticky bar docked
 * directly beneath the shared `SiteHeader` (which is `sticky top-0` and
 * `h-16`), so visitors keep both the persistent site chrome and quick
 * jumps between sections. Returns null when there are no anchors.
 */
export function ShowcaseSubNav({ navItems }: ShowcaseSubNavProps) {
  if (navItems.length === 0) return null;

  return (
    <nav
      aria-label="Sections"
      className="sticky top-16 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex w-full max-w-[var(--container-default)] items-center gap-6 overflow-x-auto px-4 py-2.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap font-mono text-xs uppercase tracking-wide text-[var(--text-tertiary)] transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
