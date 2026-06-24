import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ReflectionQuestionsEditor,
  type ReflectionQuestionRow,
} from "@/components/admin/sections/reflection-questions-editor";
import { ReflectionSummaryPanel } from "@/components/admin/reflection-summary-panel";
import { ReflectionWindowSection } from "@/components/admin/sections/reflection-window";
import {
  ReflectionResponses,
  type ReflectionQuestionGroup,
} from "@/components/admin/sections/reflection-responses";
import { AdminStepNav } from "@/components/admin/admin-step-nav";
import { resolveSlugContext } from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Reflections",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Reflections admin - the AI summary panel sits at the top (generate /
 * edit / approve), with the reflection-questions editor below. Both
 * surfaces live on the Reflections page so admins do everything
 * reflection-related in one place.
 */
export default async function SlugAdminReflectionsPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const supabase = await createClient();
  const eventId = ctx.event.id;

  const [{ data: questionRows }, { count: reflectionCount }] = await Promise.all([
    supabase
      .from("reflection_questions")
      .select("id, question_text, is_required, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
      .returns<ReflectionQuestionRow[]>(),
    supabase
      .from("reflections")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
  ]);

  const questions = (questionRows as ReflectionQuestionRow[]) ?? [];

  // Service-role read so the admin sees every participant's answers
  // (RLS would otherwise scope reflections to the viewer). The admin
  // layout already gates this page to event admins.
  const admin = createAdminClient();
  const { data: answerRows } = await admin
    .from("reflections")
    .select(
      "answer, question_id, created_at, profiles(full_name, email)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .returns<ReflectionAnswerRow[]>();

  const answers = answerRows ?? [];
  const groups: ReflectionQuestionGroup[] = questions.map((q) => ({
    questionId: q.id,
    questionText: q.question_text,
    answers: answers
      .filter((a) => a.question_id === q.id)
      .map((a) => ({
        participantName:
          a.profiles?.full_name?.trim() ||
          a.profiles?.email ||
          "Anonymous participant",
        answer: a.answer,
      })),
  }));

  return (
    <div className="space-y-10">
      <ReflectionWindowSection
        number="01"
        eventId={eventId}
        reflectionStatus={ctx.event.reflection_status}
        initialOpenAt={ctx.event.reflections_open_at}
        initialCloseAt={ctx.event.reflections_close_at}
      />

      <ReflectionSummaryPanel
        number="02"
        eventId={eventId}
        summary={ctx.event.reflection_summary}
        generatedAt={ctx.event.reflection_summary_generated_at}
        approvedAt={ctx.event.reflection_summary_approved_at}
        reflectionResponseCount={reflectionCount ?? 0}
      />

      <ReflectionResponses
        number="03"
        groups={groups}
        totalAnswers={answers.length}
      />

      <ReflectionQuestionsEditor
        number="04"
        eventId={eventId}
        questions={questions}
      />

      <AdminStepNav slug={ctx.slug} current="06" />
    </div>
  );
}

interface ReflectionAnswerRow {
  answer: string;
  question_id: string;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
}
