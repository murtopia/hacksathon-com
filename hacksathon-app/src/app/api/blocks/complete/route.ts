import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ALL_BLOCK_KEYS, type BlockKey } from "@/lib/blocks/status";

export const maxDuration = 15;

/**
 * Mark a block complete for the current user.
 *
 * Idempotent: re-posting for the same (event_id, user_id, block_key)
 * succeeds without creating duplicates. RLS gates writes to the
 * authenticated user's own rows, and the unique constraint backs the
 * idempotency.
 *
 * Today only the Shark Tank "Lock my idea" button flows through here,
 * but the route accepts any valid block_key so additional explicit
 * completion CTAs in later milestones don't need new plumbing.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { eventId?: unknown; blockKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId =
    typeof body.eventId === "string" ? body.eventId.trim() : "";
  const blockKey =
    typeof body.blockKey === "string" ? body.blockKey.trim() : "";

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }
  if (!ALL_BLOCK_KEYS.includes(blockKey as BlockKey)) {
    return NextResponse.json({ error: "Invalid blockKey" }, { status: 400 });
  }

  // Membership check: only members of the event's org can mark blocks
  // complete. RLS on `events` already filters non-members; if the
  // select returns null we treat that as a 403 to be explicit.
  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (!eventRow) {
    return NextResponse.json(
      { error: "Event not found or you are not a member" },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("block_completions").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      block_key: blockKey,
    },
    { onConflict: "event_id,user_id,block_key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
