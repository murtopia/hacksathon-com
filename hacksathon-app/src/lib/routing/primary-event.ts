import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PrimaryEventNav {
  /** Vanity slug of the user's most-recent event. */
  slug: string;
  /** Whether the user is an admin of that event. */
  isAdmin: boolean;
}

/**
 * Resolve the signed-in user's "primary" event for header navigation:
 * their most-recent event (by membership) plus whether they admin it.
 *
 * This is the light cousin of the `/dashboard` stop-over - it skips the
 * Hacky Helper / Phase 1 work and only returns what the marketing header
 * and mobile menu need to render role-aware buttons.
 *
 * Membership is read via the admin client with an explicit user filter
 * (mirroring `resolveSlugViewer` and the dashboard page): the events
 * SELECT policy also grants platform admins read access to every event,
 * so an RLS-scoped query would hand a Murtopolis admin the newest event
 * platform-wide rather than one they actually belong to.
 *
 * Wrapped in React `cache()` so the header and the mobile nav share one
 * round trip per request.
 */
export const resolvePrimaryEventForUser = cache(
  async (userId: string): Promise<PrimaryEventNav | null> => {
    const admin = createAdminClient();

    const { data: memberships } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("status", "active");

    const orgIds = Array.from(
      new Set(
        ((memberships ?? []) as { organization_id: string }[]).map(
          (m) => m.organization_id,
        ),
      ),
    );

    if (orgIds.length === 0) return null;

    const { data: event } = await admin
      .from("events")
      .select("id, vanity_slug")
      .in("organization_id", orgIds)
      .not("vanity_slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; vanity_slug: string }>();

    if (!event?.vanity_slug) return null;

    const supabase = await createClient();
    const { data: adminFlag } = await supabase.rpc("is_event_admin", {
      p_event_id: event.id,
    });

    return { slug: event.vanity_slug, isAdmin: Boolean(adminFlag) };
  },
);
