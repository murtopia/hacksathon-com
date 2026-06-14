import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Live seat accounting for an event.
 *
 *   used     = active organization_members that occupy a paid seat
 *              (is_participating = true; participants always, admins by choice)
 *   reserved = pending email invitations + pending join-link requests
 *              (each will consume a seat the moment it's accepted/approved)
 *   limit    = events.participant_limit (the purchased cap), or null for
 *              demo/internal events that are intentionally uncapped
 *   available = limit - used - reserved  (null when there's no limit)
 *
 * This is the single source of truth shared by the Team-page indicator,
 * the "Add participants" dialog, and the hard-cap enforcement in the
 * invite / join / approve / accept paths, so the numbers never disagree.
 */
export interface SeatUsage {
  limit: number | null;
  used: number;
  reserved: number;
  available: number | null;
  atCapacity: boolean;
}

/** Shared copy for hard-cap rejections across the join/invite paths. */
export const SEAT_LIMIT_REACHED_MESSAGE =
  "This event has reached its participant limit. Add participants from the Team tab to make room.";

export async function getEventSeatUsage(eventId: string): Promise<SeatUsage> {
  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("organization_id, participant_limit")
    .eq("id", eventId)
    .maybeSingle<{ organization_id: string; participant_limit: number | null }>();

  if (!eventRow) {
    return { limit: null, used: 0, reserved: 0, available: null, atCapacity: false };
  }

  const orgId = eventRow.organization_id;
  const limit = eventRow.participant_limit;

  const [usedRes, pendingInvitesRes, pendingMembersRes] = await Promise.all([
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active")
      .eq("is_participating", true),
    admin
      .from("event_invitations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "pending"),
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending"),
  ]);

  const used = usedRes.count ?? 0;
  const reserved = (pendingInvitesRes.count ?? 0) + (pendingMembersRes.count ?? 0);

  const available =
    limit === null ? null : Math.max(0, limit - used - reserved);
  const atCapacity = limit !== null && limit - used - reserved <= 0;

  return { limit, used, reserved, available, atCapacity };
}
