import { createAdminClient } from "@/lib/supabase/admin";
import type { SlugContext } from "@/lib/routing/slug-context";
import type { HelperContext } from "@/lib/helper/phase";

/**
 * Load the Hacky Helper context for an event.
 *
 * One small fanout: blocks, roster count, invitation row, invitation
 * count, and the events.join_token. We already have the event row in
 * `ctx`, so we don't re-read columns that are on it; the four new
 * date-window columns (voting_open_at, voting_close_at,
 * reflections_open_at, reflections_close_at) flow through `ctx.event`
 * once the schema migration has run and `SlugEvent` is extended.
 * Until then we fall back to null so the Helper renders cleanly.
 *
 * `invitedCount` is the count of distinct outstanding email invites -
 * used by the "Invite your team" Helper step to display "N invited so
 * far · add more anytime" without changing the done state.
 */
export async function loadHelperContext(
  ctx: SlugContext,
): Promise<HelperContext> {
  const admin = createAdminClient();
  const eventId = ctx.event.id;

  const [
    { data: blockRows },
    { count: rosterCount },
    { data: invitationRow },
    { count: invitedCount },
    { data: eventTokenRow },
  ] = await Promise.all([
    admin
      .from("blocks")
      .select("id, scheduled_date, duration_minutes")
      .eq("event_id", eventId),
    admin
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", ctx.event.organization_id)
      .eq("status", "active"),
    admin
      .from("event_invitations")
      .select("id")
      .eq("event_id", eventId)
      .limit(1)
      .maybeSingle<{ id: string }>(),
    admin
      .from("event_invitations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
    admin
      .from("events")
      .select("join_token")
      .eq("id", eventId)
      .maybeSingle<{ join_token: string | null }>(),
  ]);

  const teamChatUrl =
    typeof ctx.event.settings === "object" &&
    ctx.event.settings &&
    typeof ctx.event.settings["slack_url"] === "string"
      ? (ctx.event.settings["slack_url"] as string)
      : null;

  const hasTeamInvited =
    Boolean(invitationRow?.id) ||
    Boolean(eventTokenRow?.join_token) ||
    Boolean(
      ctx.event.settings &&
        typeof ctx.event.settings === "object" &&
        ctx.event.settings["team_invited_at"],
    );

  // SlugEvent may or may not carry the date-window columns depending
  // on whether the schema migration has run. Read defensively via the
  // event object so this code is forward- and backward-compatible.
  const eventAny = ctx.event as unknown as {
    voting_open_at?: string | null;
    voting_close_at?: string | null;
    reflections_open_at?: string | null;
    reflections_close_at?: string | null;
  };

  return {
    event: {
      title: ctx.event.title,
      welcome_message: ctx.event.welcome_message,
      logo_url: ctx.event.logo_url,
      vanity_slug: ctx.event.vanity_slug ?? null,
      voting_status: ctx.event.voting_status,
      voting_open_at: eventAny.voting_open_at ?? null,
      voting_close_at: eventAny.voting_close_at ?? null,
      results_published_at: ctx.event.results_published_at,
      reflection_status: ctx.event.reflection_status,
      reflections_open_at: eventAny.reflections_open_at ?? null,
      reflections_close_at: eventAny.reflections_close_at ?? null,
      reflection_summary: ctx.event.reflection_summary,
      reflection_summary_approved_at: ctx.event.reflection_summary_approved_at,
      settings: ctx.event.settings ?? null,
      team_chat_url: teamChatUrl,
      build_tool: ctx.event.build_tool,
    },
    org: { name: ctx.org?.name ?? "" },
    blocks: (blockRows ?? []).map((b) => ({
      id: b.id as string,
      scheduled_date: (b.scheduled_date as string | null) ?? null,
      duration_minutes: (b.duration_minutes as number | null) ?? null,
    })),
    rosterCount: rosterCount ?? 0,
    hasTeamInvited,
    invitedCount: invitedCount ?? 0,
  };
}
