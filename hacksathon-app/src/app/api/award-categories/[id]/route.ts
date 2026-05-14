import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Edit / remove a single award category. Admin-only via the event the
 * category belongs to.
 *
 * PATCH body:
 *   { name?, description?, sortOrder? }
 *
 * Both endpoints refuse when the event is locked.
 */

async function loadCategoryAndGate(
  categoryId: string,
): Promise<
  | { error: NextResponse }
  | {
      eventId: string;
      isLocked: boolean;
    }
> {
  const admin = createAdminClient();
  const { data: cat } = await admin
    .from("award_categories")
    .select("event_id")
    .eq("id", categoryId)
    .maybeSingle<{ event_id: string }>();

  if (!cat) {
    return {
      error: NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      ),
    };
  }

  const ctx = await requireEventAdmin(cat.event_id);
  if (isErrorResponse(ctx)) return { error: ctx };

  const { data: ev } = await admin
    .from("events")
    .select("is_locked")
    .eq("id", cat.event_id)
    .single<{ is_locked: boolean }>();

  return { eventId: cat.event_id, isLocked: Boolean(ev?.is_locked) };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: categoryId } = await params;
  const gated = await loadCategoryAndGate(categoryId);
  if ("error" in gated) return gated.error;
  if (gated.isLocked) {
    return NextResponse.json(
      { error: "Event is locked — categories can't be changed." },
      { status: 409 },
    );
  }

  let body: {
    name?: unknown;
    description?: unknown;
    sortOrder?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Category name must be between 2 and 80 characters." },
        { status: 400 },
      );
    }
    updates.name = name;
  }

  if (body.description !== undefined) {
    updates.description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 300) || null
        : null;
  }

  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    if (!Number.isFinite(n)) {
      return NextResponse.json(
        { error: "sortOrder must be a number." },
        { status: 400 },
      );
    }
    updates.sort_order = Math.round(n);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("award_categories")
    .update(updates)
    .eq("id", categoryId)
    .select("id, key, name, description, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, category: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: categoryId } = await params;
  const gated = await loadCategoryAndGate(categoryId);
  if ("error" in gated) return gated.error;
  if (gated.isLocked) {
    return NextResponse.json(
      { error: "Event is locked — categories can't be removed." },
      { status: 409 },
    );
  }

  const admin = createAdminClient();
  // ON DELETE CASCADE on votes.category_id wipes any in-progress votes
  // for this category. That's the right behavior — if you delete the
  // category before reveal, there's nothing left to tally.
  const { error } = await admin
    .from("award_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
