import { generateText } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { planningModel } from "@/lib/ai/model";
import {
  buildReflectionSummarySystemPrompt,
  buildReflectionSummaryUserPrompt,
  type ReflectionEntry,
} from "@/lib/ai/reflection-summary-prompt";

/**
 * Generate the AI reflection recap for an event.
 *
 * Reads every reflection answer, hands them to Claude with the
 * celebratory-recap prompt, and returns the trimmed markdown. Pure
 * generation - persistence lives in `saveReflectionSummary`.
 *
 * Extracted from the original summary route so both the explicit
 * "Generate" button and the "Mark reflections complete" transition can
 * call it.
 */
export async function generateReflectionSummary(
  eventId: string,
): Promise<string> {
  const admin = createAdminClient();

  const [{ data: eventRow }, { data: questions }, { data: reflections }] =
    await Promise.all([
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

/**
 * Generate + persist the recap. Stamps generated_at and clears any
 * prior approval so the fresh draft has to be re-approved.
 */
export async function generateAndSaveReflectionSummary(
  eventId: string,
): Promise<string> {
  const summary = await generateReflectionSummary(eventId);
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      reflection_summary: summary,
      reflection_summary_generated_at: new Date().toISOString(),
      reflection_summary_approved_at: null,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  return summary;
}
