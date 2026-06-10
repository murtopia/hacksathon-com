import { NextResponse } from "next/server";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyMembersOpen, type NotifyKind } from "@/lib/email/notify-members";

// Allow time to fan out emails to a large roster.
export const maxDuration = 60;

/**
 * Email active participants that voting / reflections just opened.
 * Admin-only, manual ("Notify team" button).
 *
 * Body: { kind: "voting" | "reflections" }
 *
 * Refuses unless the corresponding state is actually `open` - there's
 * no point telling people to go vote/reflect when they can't.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json().catch(() => null);
  const kind = body?.kind as NotifyKind | undefined;
  if (kind !== "voting" && kind !== "reflections") {
    return NextResponse.json(
      { error: "kind must be 'voting' or 'reflections'." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("voting_status, reflection_status")
    .eq("id", eventId)
    .maybeSingle<{ voting_status: string; reflection_status: string }>();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const isOpen =
    kind === "voting"
      ? event.voting_status === "open"
      : event.reflection_status === "open";
  if (!isOpen) {
    return NextResponse.json(
      {
        error:
          kind === "voting"
            ? "Open voting before notifying the team."
            : "Open reflections before notifying the team.",
      },
      { status: 409 },
    );
  }

  const result = await notifyMembersOpen(eventId, kind);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
