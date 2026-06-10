import { NextResponse } from "next/server";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";
import { openVoting } from "@/lib/voting/transitions";

export const maxDuration = 10;

/**
 * Flip the event's voting_status from 'closed' to 'open'. Admin-only.
 *
 * Idempotent: re-posting while already 'open' is a no-op. Refuses to
 * downgrade from 'revealed' back to 'open' - once awards are revealed,
 * voting is permanently closed for this event.
 *
 * Manual open also stamps voting_open_at = now() so the scheduled
 * window and the explicit-toggle paths stay in lockstep.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const result = await openVoting(eventId, { stampDateColumn: true });

  if (!result.ok) {
    if (result.refused === "revealed") {
      return NextResponse.json(
        { error: "Awards already revealed - voting is permanently closed." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, voting_status: "open" });
}
