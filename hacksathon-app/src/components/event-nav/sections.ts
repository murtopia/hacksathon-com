export interface NavItem {
  href: string;
  label: string;
  /** Optional two-digit mono prefix, e.g. "01" (admin sections only). */
  number?: string;
  isActive: (pathname: string) => boolean;
}

/**
 * Single source of truth for the member-facing event sections. Shared by
 * the desktop horizontal `ParticipantNav` and the mobile `EventMobileNav`
 * sheet so the two never drift. Admins get an extra "Hacky Admin" link at
 * the end.
 */
export function getEventNavItems(slug: string, isAdmin: boolean): NavItem[] {
  const base = `/${slug}`;

  const items: NavItem[] = [
    {
      href: base,
      label: "Event Home",
      isActive: (p) => p === base,
    },
    {
      href: `${base}/idea`,
      label: "Your Idea",
      isActive: (p) => p.startsWith(`${base}/idea`),
    },
    {
      href: `${base}/blocks`,
      label: "The Blocks",
      isActive: (p) => p.startsWith(`${base}/blocks`),
    },
    {
      href: `${base}/idealab`,
      label: "IdeaLab",
      isActive: (p) => p.startsWith(`${base}/idealab`),
    },
    {
      href: `${base}/awards`,
      label: "Hacky Awards",
      isActive: (p) => p.startsWith(`${base}/awards`),
    },
    {
      href: `${base}/reflections`,
      label: "Reflections",
      isActive: (p) => p.startsWith(`${base}/reflections`),
    },
  ];

  if (isAdmin) {
    items.push({
      href: `${base}/admin`,
      label: "Hacky Admin",
      isActive: (p) => p.startsWith(`${base}/admin`),
    });
  }

  return items;
}

/**
 * Single source of truth for the admin section tabs (00-06). Shared by
 * the desktop `AdminSubnav` bar and the mobile `EventMobileNav` sheet
 * when an admin is inside `/[slug]/admin`. Order mirrors the Hacky
 * Helper journey; the "00 Hacky Helper" tab leads.
 */
export function getAdminNavItems(slug: string): NavItem[] {
  const base = `/${slug}/admin`;

  return [
    {
      href: base,
      number: "00",
      label: "Hacky Helper",
      isActive: (p) => p === base,
    },
    {
      href: `${base}/identity`,
      number: "01",
      label: "Identity",
      isActive: (p) => p.startsWith(`${base}/identity`),
    },
    {
      href: `${base}/integrations`,
      number: "02",
      label: "Integrations",
      isActive: (p) => p.startsWith(`${base}/integrations`),
    },
    {
      href: `${base}/schedule`,
      number: "03",
      label: "Schedule",
      isActive: (p) => p.startsWith(`${base}/schedule`),
    },
    {
      href: `${base}/team`,
      number: "04",
      label: "Team",
      isActive: (p) => p.startsWith(`${base}/team`),
    },
    {
      href: `${base}/awards`,
      number: "05",
      label: "Hacky Awards",
      isActive: (p) => p.startsWith(`${base}/awards`),
    },
    {
      href: `${base}/reflections`,
      number: "06",
      label: "Reflections",
      isActive: (p) => p.startsWith(`${base}/reflections`),
    },
  ];
}
