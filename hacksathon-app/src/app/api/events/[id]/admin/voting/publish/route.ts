import { NextResponse } from "next/server";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { publishResults } from "@/lib/voting/transitions";

export const maxDuration = 10;

/**
 * Publish award results. Admin-only.
 *
 * Run after the ceremony: stamps results_published_at so winners
 * become visible to participants and the public showcase. Requires the
 * event to already be revealed (tallied + locked). Idempotent.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const result = await publishResults(eventId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    alreadyPublished: result.alreadyPublished ?? false,
  });
}
