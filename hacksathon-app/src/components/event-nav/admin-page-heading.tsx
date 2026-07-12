"use client";

import { usePathname } from "next/navigation";
import { getAdminNavItems } from "@/components/event-nav/sections";

interface AdminPageHeadingProps {
  slug: string;
}

/**
 * "Event Admin" heading in the shared admin layout, suffixed with the
 * active tab's label (e.g. "Event Admin: Reflections") so the page
 * title actually changes as admins move between sections. Mirrors how
 * `AdminSubnav` determines the active tab from the pathname, reusing
 * the same `getAdminNavItems` labels (no "01"-style numbers).
 */
export function AdminPageHeading({ slug }: AdminPageHeadingProps) {
  const pathname = usePathname();
  const active = getAdminNavItems(slug).find((item) =>
    item.isActive(pathname),
  );

  return <h2>Event Admin{active ? `: ${active.label}` : ""}</h2>;
}
