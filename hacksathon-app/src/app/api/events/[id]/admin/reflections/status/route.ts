import { NextResponse } from "next/server";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import {
  openReflections,
  markReflectionsComplete,
  reopenReflections,
  closeReflections,
  type ReflectionStatus,
} from "@/lib/reflections/transitions";

// Marking complete generates the AI recap inline, so allow the same
// generous budget the summary route uses.
export const maxDuration = 60;

/**
 * Set the reflection state. Admin-only.
 *
 * Body: { status: "closed" | "open" | "complete" }
 *
 * Transitioning to "complete" also generates the AI recap draft (a
 * separate approve step still gates publishing it). The other
 * transitions are pure status flips.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (status !== "closed" && status !== "open" && status !== "complete") {
    return NextResponse.json(
      { error: "status must be one of closed, open, complete." },
      { status: 400 },
    );
  }

  const target = status as ReflectionStatus;

  // Resolve the current status so "open" can disambiguate between
  // opening (from closed) and reopening (from complete).
  const { data: current } = await ctx.supabase
    .from("events")
    .select("reflection_status")
    .eq("id", eventId)
    .maybeSingle<{ reflection_status: ReflectionStatus }>();
  const currentStatus = current?.reflection_status ?? "closed";

  if (target === "closed") {
    const res = await closeReflections(eventId);
    if (!res.ok)
      return NextResponse.json({ error: res.error }, { status: 500 });
    return NextResponse.json({ ok: true, reflection_status: "closed" });
  }

  if (target === "open") {
    const res =
      currentStatus === "complete"
        ? await reopenReflections(eventId)
        : await openReflections(eventId, { stampDateColumn: true });
    if (!res.ok)
      return NextResponse.json({ error: res.error }, { status: 500 });
    return NextResponse.json({ ok: true, reflection_status: "open" });
  }

  // target === "complete"
  const res = await markReflectionsComplete(eventId, { stampDateColumn: true });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({
    ok: true,
    reflection_status: "complete",
    recapFailed: res.recapFailed ?? false,
  });
}
