import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventAdmin, isErrorResponse } from "@/lib/server/event-admin-guard";
import { planningModel } from "@/lib/ai/model";
import {
  buildReflectionSummarySystemPrompt,
  buildReflectionSummaryUserPrompt,
  type ReflectionEntry,
} from "@/lib/ai/reflection-summary-prompt";

export const maxDuration = 60;

/**
 * POST  → generate (or regenerate) the AI reflection summary.
 *         Reads every reflection for the event, calls Claude with a
 *         celebratory-recap prompt, and saves the markdown to
 *         events.reflection_summary. Stamps generated_at, clears
 *         approved_at so the new draft isn't accidentally "still
 *         approved" from a prior run.
 *
 * PATCH → save organizer edits to the draft. Pure storage; no AI call.
 *         Clears approved_at so any prior approval has to be re-issued
 *         after an edit.
 *
 * Approve lives in /approve/route.ts as a separate POST.
 */

async function generateSummary(eventId: string) {
  const admin = createAdminClient();

  const [
    { data: eventRow },
    { data: questions },
    { data: reflections },
  ] = await Promise.all([
    admin
      .from("events")
      .select("title, organization_id, organizations(name)")
      .eq("id", eventId)
      .maybeSingle(),
    admin
      .from("reflection_questions")
      .select("id, question_text, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    admin
      .from("reflections")
      .select("user_id, question_id, answer, profiles(full_name)")
      .eq("event_id", eventId),
  ]);

  if (!eventRow) {
    throw new Error("Event not found");
  }

  const orgRel = eventRow.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const orgName = Array.isArray(orgRel)
    ? orgRel[0]?.name ?? "Your team"
    : orgRel?.name ?? "Your team";

  const questionById = new Map<string, string>();
  for (const q of questions ?? []) {
    questionById.set(q.id as string, q.question_text as string);
  }

  const entries: ReflectionEntry[] = (reflections ?? [])
    .filter((r) => typeof r.answer === "string" && r.answer.trim().length > 0)
    .map((r) => {
      const profileRel = r.profiles as
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null;
      const fullName = Array.isArray(profileRel)
        ? profileRel[0]?.full_name
        : profileRel?.full_name;
      return {
        question:
          questionById.get(r.question_id as string) ?? "Untitled question",
        participantName: fullName?.trim() || "Anonymous",
        answer: r.answer as string,
      };
    });

  const system = buildReflectionSummarySystemPrompt({
    eventTitle: (eventRow.title as string | null) ?? "your event",
    orgName,
  });
  const userPrompt = buildReflectionSummaryUserPrompt(entries);

  const { text } = await generateText({
    model: planningModel,
    system,
    prompt: userPrompt,
    maxOutputTokens: 1500,
  });

  return text.trim();
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let summary: string;
  try {
    summary = await generateSummary(eventId);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to generate summary";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      reflection_summary: summary,
      reflection_summary_generated_at: new Date().toISOString(),
      reflection_summary_approved_at: null,
    })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, summary });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { summary?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.summary !== "string") {
    return NextResponse.json(
      { error: "summary is required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      reflection_summary: body.summary,
      reflection_summary_approved_at: null,
    })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
