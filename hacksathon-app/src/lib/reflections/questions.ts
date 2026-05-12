/**
 * Default reflection questions seeded on every new event.
 *
 * These are the Seven2 defaults. Each row goes into `reflection_questions`
 * verbatim — there's no placeholder interpolation. Per-event customization
 * (the M6 organizer wizard) edits the same table; M4 reads from it
 * either way.
 *
 * Order matters: the form renders questions in sort_order, and the AI
 * summary prompt receives them in the same order.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReflectionQuestionSeed {
  question_text: string;
  sort_order: number;
  is_required: boolean;
}

export const DEFAULT_REFLECTION_QUESTIONS: ReadonlyArray<ReflectionQuestionSeed> = [
  {
    question_text: "What surprised you most?",
    sort_order: 1,
    is_required: true,
  },
  {
    question_text: "What are you most proud of building or contributing?",
    sort_order: 2,
    is_required: true,
  },
  {
    question_text: "What was the hardest part?",
    sort_order: 3,
    is_required: true,
  },
  {
    question_text:
      "What's one thing you learned that you'll carry forward?",
    sort_order: 4,
    is_required: true,
  },
  {
    question_text: "What would you try differently next time?",
    sort_order: 5,
    is_required: true,
  },
  {
    question_text: "Anyone you want to shout out?",
    sort_order: 6,
    is_required: false,
  },
  {
    question_text:
      "Anything else you want to capture before you close this out?",
    sort_order: 7,
    is_required: false,
  },
];

/**
 * Seed the seven default reflection questions for a freshly-created event.
 * Idempotent: bails early if questions already exist for the event.
 */
export async function seedReflectionQuestions(
  client: SupabaseClient,
  params: { eventId: string },
): Promise<void> {
  const { data: existing } = await client
    .from("reflection_questions")
    .select("id")
    .eq("event_id", params.eventId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const rows = DEFAULT_REFLECTION_QUESTIONS.map((q) => ({
    event_id: params.eventId,
    question_text: q.question_text,
    sort_order: q.sort_order,
    is_required: q.is_required,
  }));

  await client.from("reflection_questions").insert(rows);
}
