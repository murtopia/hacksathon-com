import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { getEventSeatUsage, SEAT_LIMIT_REACHED_MESSAGE } from "@/lib/billing/seats";

export const maxDuration = 10;

/**
 * Remove a participant from an event's organization.
 *
 * Soft remove: flips organization_members.status to 'removed' so the
 * user's history (ideas, votes, reflections) survives. RLS keys off
 * status='active' for membership checks, so a removed user loses
 * access immediately on the next request.
 *
 * Refuses to remove admins or the last admin - a future M6 follow-on
 * (transfer ownership) handles those cases. For now, organizers can
 * only remove participants.
 *
 * Refuses to remove yourself - orgs always need at least one admin
 * present; if you really want out, you'd hand off to another admin
 * first.
 */
/**
 * Toggle whether an organizer occupies a participant seat
 * (`is_participating`).
 *
 * Only admin-role members can opt out - participants always occupy a
 * seat, which keeps the seat-usage model honest ("used = active members
 * with is_participating = true"). Turning the flag back ON consumes a
 * seat, so it's blocked when the event is already at its purchased limit.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: eventId, memberId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { isParticipating?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.isParticipating !== "boolean") {
    return NextResponse.json(
      { error: "isParticipating must be a boolean." },
      { status: 400 },
    );
  }
  const nextParticipating = body.isParticipating;

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("id, role, status, is_participating")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", memberId)
    .maybeSingle<{
      id: string;
      role: string;
      status: string;
      is_participating: boolean;
    }>();

  if (!member) {
    return NextResponse.json(
      { error: "Member not found in this event." },
      { status: 404 },
    );
  }

  if (member.role !== "admin") {
    return NextResponse.json(
      {
        error:
          "Only organizers can opt out of a seat - participants always occupy one.",
      },
      { status: 409 },
    );
  }

  if (member.status !== "active") {
    return NextResponse.json(
      { error: "Only active members can change their participation." },
      { status: 409 },
    );
  }

  if (member.is_participating === nextParticipating) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // Turning participation ON consumes a seat - respect the hard cap.
  if (nextParticipating) {
    const usage = await getEventSeatUsage(eventId);
    if (usage.limit !== null && usage.used >= usage.limit) {
      return NextResponse.json(
        { error: SEAT_LIMIT_REACHED_MESSAGE },
        { status: 409 },
      );
    }
  }

  const { error } = await admin
    .from("organization_members")
    .update({ is_participating: nextParticipating })
    .eq("id", member.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, isParticipating: nextParticipating });
}

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
