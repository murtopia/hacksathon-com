import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Create a new award category. Admin-only.
 *
 * Body: { eventId, name, description?, sortOrder? }
 *
 * The `key` column is derived from a kebab-case slug of `name` with a
 * collision-avoiding random suffix. We don't expose `key` to organizers
 * because it's an internal handle for the M4 reveal-tally pipeline.
 *
 * Refused when the event is locked (voting revealed) — categories are
 * frozen at reveal time.
 */
export async function POST(req: Request) {
  let body: {
    eventId?: unknown;
    name?: unknown;
    description?: unknown;
    sortOrder?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId : "";
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required" },
      { status: 400 },
    );
  }
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Category name must be between 2 and 80 characters." },
      { status: 400 },
    );
  }

  const description =
    typeof body.description === "string"
      ? body.description.trim().slice(0, 300)
      : null;

  const admin = createAdminClient();

  const { data: lockCheck } = await admin
    .from("events")
    .select("is_locked")
    .eq("id", eventId)
    .single<{ is_locked: boolean }>();
  if (lockCheck?.is_locked) {
    return NextResponse.json(
      { error: "Event is locked — award categories can't be changed." },
      { status: 409 },
    );
  }

  // Derive a `key` slug. Collisions are unlikely (one event tops out at
  // maybe 20 categories) but we guard anyway.
  const baseKey =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "category";
  const key = `${baseKey}-${Math.random().toString(36).slice(2, 6)}`;

  // Default sort_order to "end of list" if not provided.
  let sortOrder: number;
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    sortOrder = body.sortOrder;
  } else {
    const { data: last } = await admin
      .from("award_categories")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number | null }>();
    sortOrder = (last?.sort_order ?? 0) + 1;
  }

  const { data: inserted, error } = await admin
    .from("award_categories")
    .insert({
      event_id: eventId,
      key,
      name,
      description,
      sort_order: sortOrder,
    })
    .select("id, key, name, description, sort_order")
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Couldn't create category." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, category: inserted });
}
