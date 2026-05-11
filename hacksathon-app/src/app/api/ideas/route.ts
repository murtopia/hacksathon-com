import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToIdea } from "@/lib/idealab/types";

/**
 * POST /api/ideas
 *
 * Create a new IdeaLab entry. RLS handles event-membership permission;
 * the UNIQUE (event_id, user_id) constraint enforces one entry per
 * participant per event. If the user already has an idea here, we
 * return 409 with the existing idea's id so the client can redirect
 * to the detail view.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    eventId,
    title,
    pitch,
    description,
  }: {
    eventId?: string;
    title?: string;
    pitch?: string;
    description?: string | null;
  } = body;

  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json(
      { error: "Missing eventId" },
      { status: 400 }
    );
  }

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  if (!pitch?.trim()) {
    return NextResponse.json(
      { error: "The teaser line is required" },
      { status: 400 }
    );
  }

  // Defense in depth: bail early if the user already has an idea in
  // this event. The DB UNIQUE index is still authoritative — if a
  // simultaneous request slips through, the insert will 409.
  const { data: existing } = await supabase
    .from("ideas")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: "You already have an idea in this event",
        existingIdeaId: existing.id,
      },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ideas")
    .insert({
      event_id: eventId,
      user_id: user.id,
      title: title.trim(),
      pitch: pitch.trim(),
      description: description?.trim() || null,
      // status defaults to 'in_progress' per migration 00006
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    // 23505 = unique_violation (Postgres error code). Catches the race
    // where two requests both pass the existing-row check above.
    if (insertError?.code === "23505") {
      const { data: existing2 } = await supabase
        .from("ideas")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      return NextResponse.json(
        {
          error: "You already have an idea in this event",
          existingIdeaId: existing2?.id,
        },
        { status: 409 }
      );
    }

    console.error("[api/ideas] insert failed", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create idea" },
      { status: 500 }
    );
  }

  return NextResponse.json({ idea: rowToIdea(inserted) });
}
