import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReflectionsScreen } from "@/components/blocks/reflections-screen";
import type {
  ReflectionQuestion,
  ReflectionAnswer,
} from "@/components/blocks/reflection-form";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Reflections",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Reflections - the +02 screen at a stable URL.
 *
 * Mirrors the body of `/[slug]/blocks/+02` (which redirects here).
 * Block-completion is still keyed on `+02` in `block_completions`.
 */
export default async function SlugReflectionsPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(
      `/login?next=${encodeURIComponent(slugPath(ctx.slug, "reflections"))}`,
    );
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();
  const userId = viewer.user.id;
  const eventId = ctx.event.id;

  const [{ data: questionRows }, { data: reflectionRows }] = await Promise.all([
    supabase
      .from("reflection_questions")
      .select("id, question_text, sort_order, is_required")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("reflections")
      .select("question_id, answer")
      .eq("event_id", eventId)
      .eq("user_id", userId),
  ]);

  const questions: ReflectionQuestion[] = (questionRows ?? []).map((q) => ({
    id: q.id as string,
    question_text: q.question_text as string,
    sort_order: (q.sort_order as number) ?? 0,
    is_required: Boolean(q.is_required),
  }));

  const initialAnswers: ReflectionAnswer[] = (reflectionRows ?? []).map(
    (r) => ({
      questionId: r.question_id as string,
      answer: (r.answer as string) ?? "",
    }),
  );

  return (
    <div className="max-w-[var(--container-narrow)] space-y-8">
      <header className="space-y-3">
        <p className="mono-label">{ctx.event.title}</p>
        <h2>Reflections</h2>
        <p className="lead">
          What worked, what didn&apos;t, what surprised you. Your answers shape
          the recap.
        </p>
      </header>

      <ReflectionsScreen
        eventId={eventId}
        questions={questions}
        initialAnswers={initialAnswers}
      />
    </div>
  );
}
