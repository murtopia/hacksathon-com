import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServer } from "@/lib/analytics/server";
import { AnalyticsEvent } from "@/lib/analytics/events";

export const maxDuration = 10;

/**
 * Public join-link endpoint.
 *
 * Caller must be authenticated. Looks up the event by `join_token`,
 * then upserts an `organization_members` row with role='participant'
 * and status='pending'. The admin approves (or rejects) from the
 * participants panel.
 *
 * Idempotent across the lifecycle:
 *   - existing row, status='pending'  → returns already_pending
 *   - existing row, status='active'   → returns already_active + redirect
 *   - existing row, status='invited'  → flips to active (the email-invite
 *                                       path already vetted them)
 *   - existing row, status='removed'  → flips back to pending so the admin
 *                                       can re-approve. Avoids "blocked
 *                                       forever" surprises if someone is
 *                                       re-added to the team.
 *
 * RLS bypass: uses the admin client because the user has no org_members
 * row yet, so the events / organization_members RLS policies would block
 * the read.
 */

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await params;
  const token = (rawToken ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to join." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();

  const { data: eventRow, error: eventError } = await admin
    .from("events")
    .select("id, organization_id, organizations(slug)")
    .eq("join_token", token)
    .maybeSingle<{
      id: string;
      organization_id: string;
      organizations:
        | { slug: string }
        | { slug: string }[]
        | null;
    }>();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }
  if (!eventRow) {
    return NextResponse.json(
      { error: "This invite link is no longer active." },
      { status: 404 },
    );
  }

  const orgRel = eventRow.organizations;
  const slug = Array.isArray(orgRel)
    ? (orgRel[0]?.slug ?? null)
    : (orgRel?.slug ?? null);

  const { data: existing } = await admin
    .from("organization_members")
    .select("id, status, role")
    .eq("organization_id", eventRow.organization_id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; status: string; role: string }>();

  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json({
        status: "already_active",
        eventId: eventRow.id,
        slug,
        redirect: slug ? `/${slug}` : null,
      });
    }
    if (existing.status === "pending") {
      return NextResponse.json({
        status: "already_pending",
        eventId: eventRow.id,
        slug,
      });
    }
    if (existing.status === "invited") {
      // They were already pre-invited via email; the join-link just
      // collapses the workflow - admit them directly.
      const { error: upErr } = await admin
        .from("organization_members")
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      return NextResponse.json({
        status: "already_active",
        eventId: eventRow.id,
        slug,
        redirect: slug ? `/${slug}` : null,
      });
    }
    // status === 'removed' (or anything else) → bounce them back to pending.
    const { error: upErr } = await admin
      .from("organization_members")
      .update({ status: "pending", role: "participant" })
      .eq("id", existing.id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    return NextResponse.json({
      status: "pending",
      eventId: eventRow.id,
      slug,
    });
  }

  const { error: insertError } = await admin
    .from("organization_members")
    .insert({
      organization_id: eventRow.organization_id,
      user_id: user.id,
      role: "participant",
      status: "pending",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await captureServer({
    distinctId: user.id,
    event: AnalyticsEvent.ParticipantJoined,
    properties: {
      event_id: eventRow.id,
      organization_id: eventRow.organization_id,
      slug,
    },
  });

  return NextResponse.json({
    status: "pending",
    eventId: eventRow.id,
    slug,
  });
}
