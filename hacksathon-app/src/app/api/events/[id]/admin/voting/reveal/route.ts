import { NextResponse } from "next/server";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";
import { revealAwards } from "@/lib/voting/transitions";

export const maxDuration = 15;

/**
 * Reveal awards. Admin-only.
 *
 * Delegates to `revealAwards` which: tallies votes, snapshots winners
 * per category, flips voting_status='revealed', locks the event, and
 * (since stampDateColumn=true here) stamps voting_close_at = now() so
 * manual reveals and date-driven reveals stay in lockstep.
 *
 * Idempotent: re-posting after a reveal returns the cached winners
 * without re-tallying.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const result = await revealAwards(eventId, { stampDateColumn: true });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    alreadyRevealed: result.alreadyRevealed ?? false,
    winners: result.winners ?? [],
  });
}
