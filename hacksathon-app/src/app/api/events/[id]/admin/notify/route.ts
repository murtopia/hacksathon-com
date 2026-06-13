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
 * Email active participants that voting / reflections just opened, or
 * remind those whose IdeaLab isn't demo-ready before voting opens.
 * Admin-only, manual ("Notify team" / "Remind IdeaLab" button).
 *
 * Body: { kind: "voting" | "reflections" | "idealab" }
 *
 * Refuses unless the moment is right: voting/reflections must be `open`
 * (no point telling people to act when they can't), and the IdeaLab
 * reminder is only allowed while voting is still `closed` (it's a
 * pre-voting nudge).
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
  if (kind !== "voting" && kind !== "reflections" && kind !== "idealab") {
    return NextResponse.json(
      { error: "kind must be 'voting', 'reflections', or 'idealab'." },
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

  // Each kind has a precondition: voting/reflections must be open; the
  // IdeaLab reminder is a pre-voting nudge, so it's only allowed while
  // voting is still closed.
  const precondition =
    kind === "voting"
      ? {
          ok: event.voting_status === "open",
          error: "Open voting before notifying the team.",
        }
      : kind === "reflections"
        ? {
            ok: event.reflection_status === "open",
            error: "Open reflections before notifying the team.",
          }
        : {
            ok: event.voting_status === "closed",
            error: "The IdeaLab reminder can only be sent before voting opens.",
          };

  if (!precondition.ok) {
    return NextResponse.json({ error: precondition.error }, { status: 409 });
  }

  const result = await notifyMembersOpen(eventId, kind);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
