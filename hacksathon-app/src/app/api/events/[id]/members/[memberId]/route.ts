import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Remove a participant from an event's organization.
 *
 * Soft remove: flips organization_members.status to 'removed' so the
 * user's history (ideas, votes, reflections) survives. RLS keys off
 * status='active' for membership checks, so a removed user loses
 * access immediately on the next request.
 *
 * Refuses to remove admins or the last admin — a future M6 follow-on
 * (transfer ownership) handles those cases. For now, organizers can
 * only remove participants.
 *
 * Refuses to remove yourself — orgs always need at least one admin
 * present; if you really want out, you'd hand off to another admin
 * first.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: eventId, memberId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  if (memberId === ctx.userId) {
    return NextResponse.json(
      { error: "You can't remove yourself from your own event." },
      { status: 409 },
    );
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, role, status, user_id")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", memberId)
    .maybeSingle<{
      id: string;
      role: string;
      status: string;
      user_id: string;
    }>();

  if (!member) {
    return NextResponse.json(
      { error: "Member not found in this event." },
      { status: 404 },
    );
  }

  if (member.role === "admin") {
    return NextResponse.json(
      {
        error:
          "Can't remove an organization admin. Demote them first (not yet supported).",
      },
      { status: 409 },
    );
  }

  if (member.status === "removed") {
    return NextResponse.json({ ok: true, noop: true });
  }

  const { error } = await admin
    .from("organization_members")
    .update({ status: "removed" })
    .eq("id", member.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
