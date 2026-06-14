export interface EventNavItem {
  href: string;
  label: string;
  match: (pathname: string, base: string) => boolean;
}

/**
 * Single source of truth for the member-facing event sections. Shared by
 * the desktop horizontal `ParticipantNav` and the mobile `EventMobileNav`
 * sheet so the two never drift. Admins get an extra "Hacky Admin" link at
 * the end.
 */
export function getEventNavItems(slug: string, isAdmin: boolean): EventNavItem[] {
  const base = `/${slug}`;

  const items: EventNavItem[] = [
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

  return items;
}
