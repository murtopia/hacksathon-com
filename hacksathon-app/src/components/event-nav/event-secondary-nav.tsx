"use client";

import { usePathname } from "next/navigation";
import { AdminSubnav } from "@/components/event-nav/admin-subnav";
import { ParticipantNav } from "@/components/event-nav/participant-nav";

interface EventSecondaryNavProps {
  slug: string;
  isAdmin: boolean;
}

/**
 * Picks which secondary nav renders directly beneath the member top bar.
 *
 * On admin routes (`/[slug]/admin/*`) for admins, the event
 * `ParticipantNav` gives way to the `AdminSubnav` so the back office
 * reads as its own view with a single secondary nav instead of stacking
 * a third level. Everywhere else, members get the usual participant nav
 * (which keeps the "Hacky Admin" entry link for admins).
 */
export function EventSecondaryNav({ slug, isAdmin }: EventSecondaryNavProps) {
  const pathname = usePathname();
  const inAdmin = isAdmin && pathname.startsWith(`/${slug}/admin`);

  if (inAdmin) {
    return <AdminSubnav slug={slug} />;
  }

  return <ParticipantNav slug={slug} isAdmin={isAdmin} />;
}
