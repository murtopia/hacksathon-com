import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import {
  EXTENDABLE_BASE_KEYS,
  MAX_EXTRA_PER_TYPE,
  type ExtendableBaseKey,
} from "@/lib/blocks/status";

export const maxDuration = 10;

interface BlockRow {
  id: string;
  block_key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  purpose: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

/**
 * Create an extra "continuation" session for an extendable base key.
 *
 * Large teams sometimes need more than one Shark Tank pitch slot or
 * Showcase window. Rather than refactor the fixed block enum, we add an
 * instance block (e.g. `02-2`, `FINAL-3`) that inherits the base block's
 * screen + copy. Cap of {@link MAX_EXTRA_PER_TYPE} extra per base, kept
 * in app code so changing it needs no migration.
 *
 * Body: { eventId: string, baseKey: "02" | "FINAL" }
 */
export async function POST(req: Request) {
  let body: { eventId?: unknown; baseKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const baseKey = typeof body.baseKey === "string" ? body.baseKey.trim() : "";

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }
  if (!(EXTENDABLE_BASE_KEYS as ReadonlyArray<string>).includes(baseKey)) {
    return NextResponse.json(
      { error: "baseKey must be an extendable session." },
      { status: 400 },
    );
  }

  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const admin = createAdminClient();

  const { data: eventRow } = await admin
    .from("events")
    .select("is_locked")
    .eq("id", eventId)
    .single<{ is_locked: boolean }>();

  if (eventRow?.is_locked) {
    return NextResponse.json(
      { error: "Event is locked - schedule can't be changed." },
      { status: 409 },
    );
  }

  // Load the base block and any existing instances for this group.
  const { data: groupRows, error: groupError } = await admin
    .from("blocks")
    .select(
      "id, block_key, title, subtitle, description, purpose, duration_minutes, sort_order",
    )
    .eq("event_id", eventId)
    .or(`block_key.eq.${baseKey},block_key.like.${baseKey}-%`)
    .order("sort_order", { ascending: true })
    .returns<BlockRow[]>();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  const base = groupRows?.find((b) => b.block_key === baseKey);
  if (!base) {
    return NextResponse.json(
      { error: "Base session not found for this event." },
      { status: 404 },
    );
  }

  const instances = (groupRows ?? []).filter((b) => b.block_key !== baseKey);
  if (instances.length >= MAX_EXTRA_PER_TYPE) {
    return NextResponse.json(
      { error: `You can add at most ${MAX_EXTRA_PER_TYPE} extra sessions.` },
      { status: 400 },
    );
  }

  // Smallest free part number >= 2.
  const usedNumbers = new Set(
    instances
      .map((b) => Number(b.block_key.split("-")[1]))
      .filter((n) => Number.isFinite(n)),
  );
  let nextNumber = 2;
  while (usedNumbers.has(nextNumber)) nextNumber += 1;

  const newKey = `${baseKey}-${nextNumber}`;

  // Shift everything after the group down so the new row lands right
  // after its group (no sort_order unique constraint, so a simple +1 of
  // each affected row is safe).
  const groupMax = Math.max(...(groupRows ?? []).map((b) => b.sort_order));
  const insertOrder = groupMax + 1;

  const { data: afterRows, error: afterError } = await admin
    .from("blocks")
    .select("id, sort_order")
    .eq("event_id", eventId)
    .gt("sort_order", groupMax)
    .order("sort_order", { ascending: false })
    .returns<{ id: string; sort_order: number }[]>();

  if (afterError) {
    return NextResponse.json({ error: afterError.message }, { status: 500 });
  }

  for (const row of afterRows ?? []) {
    const { error: bumpError } = await admin
      .from("blocks")
      .update({ sort_order: row.sort_order + 1 })
      .eq("id", row.id);
    if (bumpError) {
      return NextResponse.json({ error: bumpError.message }, { status: 500 });
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("blocks")
    .insert({
      event_id: eventId,
      block_key: newKey,
      title: `${base.title} (Part ${nextNumber})`,
      subtitle: base.subtitle,
      description: base.description,
      purpose: base.purpose,
      duration_minutes: base.duration_minutes ?? 30,
      sort_order: insertOrder,
    })
    .select("id, block_key, title, sort_order")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, block: inserted });
}
