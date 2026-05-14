import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

/**
 * Edit / remove a single reflection question.
 *
 * PATCH body: { questionText?, isRequired?, sortOrder? }
 *
 * Delete cascades to all `reflections` rows for the question via the
 * 00001 schema FK. That's intentional — if you remove the question,
 * you remove the answers tied to it.
 */

async function loadQuestionAndGate(
  questionId: string,
): Promise<{ error: NextResponse } | { eventId: string }> {
  const admin = createAdminClient();
  const { data: q } = await admin
    .from("reflection_questions")
    .select("event_id")
    .eq("id", questionId)
    .maybeSingle<{ event_id: string }>();

  if (!q) {
    return {
      error: NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      ),
    };
  }

  const ctx = await requireEventAdmin(q.event_id);
  if (isErrorResponse(ctx)) return { error: ctx };

  return { eventId: q.event_id };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: questionId } = await params;
  const gated = await loadQuestionAndGate(questionId);
  if ("error" in gated) return gated.error;

  let body: {
    questionText?: unknown;
    isRequired?: unknown;
    sortOrder?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.questionText !== undefined) {
    const t =
      typeof body.questionText === "string"
        ? body.questionText.trim()
        : "";
    if (t.length < 4 || t.length > 280) {
      return NextResponse.json(
        { error: "Question must be between 4 and 280 characters." },
        { status: 400 },
      );
    }
    updates.question_text = t;
  }

  if (body.isRequired !== undefined) {
    updates.is_required = Boolean(body.isRequired);
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
    .from("reflection_questions")
    .update(updates)
    .eq("id", questionId)
    .select("id, question_text, is_required, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, question: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: questionId } = await params;
  const gated = await loadQuestionAndGate(questionId);
  if ("error" in gated) return gated.error;

  const admin = createAdminClient();
  const { error } = await admin
    .from("reflection_questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
