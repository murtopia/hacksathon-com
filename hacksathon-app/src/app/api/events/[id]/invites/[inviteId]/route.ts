import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Revoke a pending invitation. Admin-only.
 *
 * Soft-delete: flips status to 'revoked' rather than removing the row
 * so we keep an audit trail. The partial unique index ignores revoked
 * rows, so a future re-invite to the same email works.
 *
 * Accepted invitations are not revocable from this endpoint - to remove
 * an accepted participant, use DELETE /api/events/[id]/members/[memberId].
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  const { id: eventId, inviteId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("event_invitations")
    .select("status")
    .eq("id", inviteId)
    .eq("event_id", eventId)
    .maybeSingle<{ status: string }>();

  if (!invite) {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 },
    );
  }
  if (invite.status === "accepted") {
    return NextResponse.json(
      {
        error:
          "This invite has already been accepted. Remove the participant from the roster instead.",
      },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("event_invitations")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
