import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { buildJoinUrl, generateJoinToken } from "@/lib/join/tokens";
import { stampSetting } from "@/lib/events/settings";

export const maxDuration = 10;

/**
 * Per-event shareable join link.
 *
 *   POST   → generate (or rotate) the token. Returns the token + full
 *            URL. Idempotent in the sense that calling it again just
 *            rotates: the old URL stops working and a fresh one comes
 *            back. Useful when an admin wants to "regenerate" a link
 *            they think might have leaked.
 *   DELETE → null out the token. The /join/{token} page will then 404
 *            for the old URL. Existing pending requests (rows already
 *            in organization_members.status='pending') are intentionally
 *            left alone so the admin can still approve or reject them.
 */

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();
  // Up to a handful of retries in the (vanishingly rare) case of a
  // base64url collision. We use the partial unique index on
  // events.join_token to enforce global uniqueness.
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = generateJoinToken();
    const { error } = await admin
      .from("events")
      .update({ join_token: token })
      .eq("id", eventId);

    if (!error) {
      // Stamp the "team invited" milestone - generating a join link is
      // a legitimate "I've started inviting people" signal even if no
      // emails have been sent yet.
      await stampSetting(eventId, "team_invited_at");

      return NextResponse.json({
        ok: true,
        token,
        url: buildJoinUrl(token),
      });
    }

    // 23505 = unique_violation. Anything else is a real error.
    if (!error.message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Could not allocate a unique join token. Try again." },
    { status: 500 },
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ join_token: null })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
