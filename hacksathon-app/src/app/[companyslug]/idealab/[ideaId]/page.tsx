import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToIdea, type IdeaWithAuthor } from "@/lib/idealab/types";
import { IdeaDetail } from "@/components/idealab/idea-detail";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Idea",
};

interface PageProps {
  params: Promise<{ companyslug: string; ideaId: string }>;
}

/**
 * Single-idea detail in the IdeaLab.
 *
 * If the requesting user owns this idea we redirect to `/[slug]/idea`
 * - the dedicated owner view that also surfaces planning documents.
 * Non-owners stay here and get the read-only `IdeaDetail`.
 */
export default async function SlugIdeaLabIdeaPage({ params }: PageProps) {
  const { companyslug, ideaId } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(
      `/login?next=${encodeURIComponent(
        slugPath(ctx.slug, `idealab/${ideaId}`),
      )}`,
    );
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("ideas")
    .select(
      "*, profile:profiles!ideas_user_id_fkey(full_name, avatar_url)",
    )
    .eq("id", ideaId)
    .eq("event_id", ctx.event.id)
    .single();

  if (!row) notFound();

  const profile = row.profile as {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  const idea: IdeaWithAuthor = {
    ...rowToIdea(row),
    authorName: profile?.full_name ?? null,
    authorAvatarUrl: profile?.avatar_url ?? null,
  };

  const isOwner = idea.userId === viewer.user.id;

  if (isOwner) {
    redirect(slugPath(ctx.slug, "idea"));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href={slugPath(ctx.slug, "idealab")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to the IdeaLab
        </Link>
      </div>

      <IdeaDetail
        initialIdea={idea}
        eventId={ctx.event.id}
        isOwner={false}
        slug={ctx.slug}
        buildTool={ctx.event.build_tool}
      />
    </div>
  );
}
