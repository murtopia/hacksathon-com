import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idealab/idea-card";
import { rowToIdea, type IdeaWithAuthor } from "@/lib/idealab/types";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "IdeaLab",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * IdeaLab - every idea in the event. Members only.
 *
 * The participant's own idea is pinned to the top so they can find it
 * fast. Their card links to the per-idea detail page at
 * `/[slug]/idealab/[ideaId]` (which redirects owners to `/[slug]/idea`
 * for the richer detail view).
 */
export default async function SlugIdeaLabPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(
      `/login?next=${encodeURIComponent(slugPath(ctx.slug, "idealab"))}`,
    );
  if (!viewer.isMember && !viewer.isAdmin) redirect(slugPath(ctx.slug));

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("ideas")
    .select(
      "*, profile:profiles!ideas_user_id_fkey(full_name, avatar_url)",
    )
    .eq("event_id", ctx.event.id)
    .order("created_at", { ascending: false });

  const ideas: IdeaWithAuthor[] = (rows ?? []).map((row) => {
    const profile = row.profile as {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
    return {
      ...rowToIdea(row),
      authorName: profile?.full_name ?? null,
      authorAvatarUrl: profile?.avatar_url ?? null,
    };
  });

  const myIdea = ideas.find((i) => i.userId === viewer.user.id) ?? null;
  const others = ideas.filter((i) => i.userId !== viewer.user.id);
  const ordered = myIdea ? [myIdea, ...others] : others;

  const totalCount = ideas.length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="mono-label">{ctx.event.title}</p>
          <h2>IdeaLab</h2>
          <p className="lead">
            {totalCount === 0
              ? "Be the first to add your idea."
              : `${totalCount} idea${totalCount === 1 ? "" : "s"} submitted so far.`}
          </p>
        </div>
        {!myIdea && (
          <Button asChild variant="pill" size="pill">
            <Link href={slugPath(ctx.slug, "idea/new")}>Add your idea</Link>
          </Button>
        )}
        {myIdea && (
          <Button asChild variant="pill" size="pill">
            <Link href={slugPath(ctx.slug, "idea")}>Open your idea</Link>
          </Button>
        )}
      </header>

      {ordered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-base font-medium">No ideas yet.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            What are you going to build? Add your idea and kick this thing
            off.
          </p>
          <Button asChild variant="pill" size="pill" className="mt-6">
            <Link href={slugPath(ctx.slug, "idea/new")}>Add your idea</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              slug={ctx.slug}
              isOwner={idea.userId === viewer.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
