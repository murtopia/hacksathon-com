import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IdeaForm } from "@/components/idealab/idea-form";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Your Big Idea",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Submission form for the participant's idea.
 *
 * If the participant already has an idea in this event the page
 * redirects to `/[slug]/idea` (the detail view) - the UNIQUE
 * (event_id, user_id) constraint would 409 the POST anyway, but
 * redirecting up front means the form never pretends submission is
 * open when it isn't.
 */
export default async function SlugNewIdeaPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(
      `/login?next=${encodeURIComponent(slugPath(ctx.slug, "idea/new"))}`,
    );
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ideas")
    .select("id")
    .eq("event_id", ctx.event.id)
    .eq("user_id", viewer.user.id)
    .maybeSingle();

  if (existing) {
    redirect(slugPath(ctx.slug, "idea"));
  }

  return (
    <div className="max-w-[var(--container-narrow)] space-y-8">
      <header className="space-y-3">
        <p className="mono-label">{ctx.event.title}</p>
        <h2>Your big idea</h2>
        <p className="lead">
          Keep it short, sweet, and a little bit wild. One spark is all it
          takes.
        </p>
      </header>

      <IdeaForm eventId={ctx.event.id} slug={ctx.slug} />
    </div>
  );
}
