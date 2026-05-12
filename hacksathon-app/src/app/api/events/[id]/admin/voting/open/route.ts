import { NextResponse } from "next/server";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Flip the event's voting_status from 'closed' to 'open'. Admin-only.
 *
 * Idempotent: re-posting while already 'open' is a no-op. Refuses to
 * downgrade from 'revealed' back to 'open' — once awards are revealed,
 * voting is permanently closed for this event.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const { data: current } = await ctx.supabase
    .from("events")
    .select("voting_status")
    .eq("id", eventId)
    .single<{ voting_status: string }>();

  if (current?.voting_status === "revealed") {
    return NextResponse.json(
      { error: "Awards already revealed — voting is permanently closed." },
      { status: 409 },
    );
  }

  const { error } = await ctx.supabase
    .from("events")
    .update({ voting_status: "open" })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, voting_status: "open" });
}
