import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToIdea, type IdeaWithAuthor } from "@/lib/idealab/types";
import { IdeaDetail } from "@/components/idealab/idea-detail";

export const metadata: Metadata = {
  title: "Idea",
};

interface PageProps {
  params: Promise<{ id: string; ideaId: string }>;
}

/**
 * Detail / edit view for a single idea.
 *
 * Server component handles the read + permission resolution; the
 * IdeaDetail client component owns the inline-edit, status-toggle,
 * and screenshot-upload state. We pass `isOwner` so the client knows
 * whether to render edit affordances at all.
 */
export default async function IdeaDetailPage({ params }: PageProps) {
  const { id: eventId, ideaId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("ideas")
    .select("*, profile:profiles!ideas_user_id_fkey(full_name)")
    .eq("id", ideaId)
    .eq("event_id", eventId)
    .single();

  if (!row) notFound();

  const profile = row.profile as { full_name: string | null } | null;
  const idea: IdeaWithAuthor = {
    ...rowToIdea(row),
    authorName: profile?.full_name ?? null,
  };

  const isOwner = idea.userId === user.id;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href={`/events/${eventId}/idealab`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to IdeaLab
        </Link>
      </div>

      <IdeaDetail
        initialIdea={idea}
        eventId={eventId}
        isOwner={isOwner}
      />
    </div>
  );
}
