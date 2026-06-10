import { NextResponse } from "next/server";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";
import { closeVoting } from "@/lib/voting/transitions";

export const maxDuration = 10;

/**
 * Pause voting - flip voting_status from 'open' back to 'closed'.
 * Admin-only. The reverse of /voting/open.
 *
 * Idempotent: re-posting while already 'closed' is a no-op. Refuses to
 * touch a 'revealed' event - once awards are tallied + locked, voting
 * can't be reopened; the path forward is publish.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const result = await closeVoting(eventId);

  if (!result.ok) {
    if (result.refused === "revealed") {
      return NextResponse.json(
        { error: "Awards already revealed - voting can't be reopened." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, voting_status: "closed" });
}
