import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import {
  baseBlockKey,
  instancePartNumber,
  isInstanceBlockKey,
} from "@/lib/blocks/status";

export const maxDuration = 10;

/**
 * Update a single block's schedule (date/time + duration).
 *
 * Admin-only. We resolve the block's event_id first and then run the
 * shared admin guard against it - that way callers can't sidestep the
 * gate by editing a block in someone else's event.
 *
 * Accepts:
 *   { scheduled_date?: string | null, duration_minutes?: number | null }
 *
 * Lock guard: refuses updates when the event is locked.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: blockId } = await params;

  const admin = createAdminClient();
  const { data: blockRow } = await admin
    .from("blocks")
    .select("id, event_id")
    .eq("id", blockId)
    .maybeSingle<{ id: string; event_id: string }>();

  if (!blockRow) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const ctx = await requireEventAdmin(blockRow.event_id);
  if (isErrorResponse(ctx)) return ctx;

  const { data: eventRow } = await admin
    .from("events")
    .select("is_locked")
    .eq("id", blockRow.event_id)
    .single<{ is_locked: boolean }>();

  if (eventRow?.is_locked) {
    return NextResponse.json(
      { error: "Event is locked - schedule can't be changed." },
      { status: 409 },
    );
  }

  let body: {
    scheduled_date?: string | null;
    duration_minutes?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.scheduled_date !== undefined) {
    if (body.scheduled_date === null || body.scheduled_date === "") {
      updates.scheduled_date = null;
    } else if (typeof body.scheduled_date === "string") {
      const parsed = new Date(body.scheduled_date);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "scheduled_date is not a valid ISO datetime." },
          { status: 400 },
        );
      }
      updates.scheduled_date = parsed.toISOString();
    } else {
      return NextResponse.json(
        { error: "scheduled_date must be a string or null." },
        { status: 400 },
      );
    }
  }

  if (body.duration_minutes !== undefined) {
    if (body.duration_minutes === null) {
      updates.duration_minutes = null;
    } else {
      const n = Number(body.duration_minutes);
      if (!Number.isFinite(n) || n < 5 || n > 720) {
        return NextResponse.json(
          { error: "duration_minutes must be between 5 and 720." },
          { status: 400 },
        );
      }
      updates.duration_minutes = Math.round(n);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const { data: updated, error } = await admin
    .from("blocks")
    .update(updates)
    .eq("id", blockId)
    .select("id, block_key, scheduled_date, duration_minutes")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, block: updated });
}

/**
 * Delete an extra "continuation" session.
 *
 * Admin-only and instance-only: canonical blocks (the original 10 keys)
 * can never be removed, so this refuses any block_key that isn't an
 * instance like `02-2` / `06-2` / `FINAL-3`. Only the highest-numbered
 * instance of a group can be removed (peel off the top) so numbering
 * stays contiguous. Refuses when the event is locked. Best-effort
 * cleanup of any block_completions written for the key.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: blockId } = await params;

  const admin = createAdminClient();
  const { data: blockRow } = await admin
    .from("blocks")
    .select("id, event_id, block_key")
    .eq("id", blockId)
    .maybeSingle<{ id: string; event_id: string; block_key: string }>();

  if (!blockRow) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  if (!isInstanceBlockKey(blockRow.block_key)) {
    return NextResponse.json(
      { error: "Only extra sessions can be removed." },
      { status: 400 },
    );
  }

  const ctx = await requireEventAdmin(blockRow.event_id);
  if (isErrorResponse(ctx)) return ctx;

  const { data: eventRow } = await admin
    .from("events")
    .select("is_locked")
    .eq("id", blockRow.event_id)
    .single<{ is_locked: boolean }>();

  if (eventRow?.is_locked) {
    return NextResponse.json(
      { error: "Event is locked - schedule can't be changed." },
      { status: 409 },
    );
  }

  // Only the highest-numbered instance of a group may be removed, so the
  // middle of a group can't be deleted (which would leave a gap and put
  // the numbering out of order). Peel sessions off the top.
  const baseKey = baseBlockKey(blockRow.block_key);
  const thisPart = instancePartNumber(blockRow.block_key) ?? 0;
  const { data: siblings } = await admin
    .from("blocks")
    .select("block_key")
    .eq("event_id", blockRow.event_id)
    .like("block_key", `${baseKey}-%`)
    .returns<{ block_key: string }[]>();

  const maxPart = (siblings ?? []).reduce((max, row) => {
    const part = instancePartNumber(row.block_key) ?? 0;
    return part > max ? part : max;
  }, 0);

  if (thisPart < maxPart) {
    return NextResponse.json(
      { error: "Remove the most recent session first." },
      { status: 400 },
    );
  }

  const { error: deleteError } = await admin
    .from("blocks")
    .delete()
    .eq("id", blockId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Best-effort: clear any completion rows for this instance key.
  await admin
    .from("block_completions")
    .delete()
    .eq("event_id", blockRow.event_id)
    .eq("block_key", blockRow.block_key);

  return NextResponse.json({ ok: true });
}
