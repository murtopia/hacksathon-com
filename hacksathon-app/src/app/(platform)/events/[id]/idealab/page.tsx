import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/idealab/idea-card";
import { rowToIdea, type IdeaWithAuthor } from "@/lib/idealab/types";

export const metadata: Metadata = {
  title: "IdeaLab",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Gallery view for a single event's IdeaLab.
 *
 * Visibility model:
 *   - All event members see every idea (RLS on `ideas` is
 *     event-scoped via is_event_member).
 *   - The current user's idea is pinned to the top of the grid.
 *   - If the user hasn't submitted yet, the header CTA points to the
 *     submission form.
 */
export default async function EventIdeaLabPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the event — RLS will silently filter out events the user
  // can't access, in which case we 404.
  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  // Pull ideas + author profile in one round trip. We can't trust a
  // FK alias here because there's only one path between ideas and
  // profiles (user_id → profiles.id), so the implicit join is safe.
  const { data: rows } = await supabase
    .from("ideas")
    .select("*, profile:profiles!ideas_user_id_fkey(full_name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const ideas: IdeaWithAuthor[] = (rows ?? []).map((row) => {
    const profile = row.profile as { full_name: string | null } | null;
    return {
      ...rowToIdea(row),
      authorName: profile?.full_name ?? null,
    };
  });

  // Pin the user's idea (if any) to the front.
  const myIdea = ideas.find((i) => i.userId === user.id) ?? null;
  const others = ideas.filter((i) => i.userId !== user.id);
  const ordered = myIdea ? [myIdea, ...others] : others;

  const totalCount = ideas.length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {event.title}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">IdeaLab</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount === 0
              ? "Be the first to drop in your idea."
              : `${totalCount} idea${totalCount === 1 ? "" : "s"} submitted so far.`}
          </p>
        </div>
        {!myIdea && (
          <Button asChild>
            <Link href={`/events/${eventId}/idealab/new`}>Submit your idea</Link>
          </Button>
        )}
        {myIdea && (
          <Button asChild variant="outline">
            <Link href={`/events/${eventId}/idealab/${myIdea.id}`}>
              Edit your idea
            </Link>
          </Button>
        )}
      </header>

      {ordered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-base font-medium">No ideas yet.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            What are you going to build? Drop your idea in and kick this thing off.
          </p>
          <Button asChild className="mt-6">
            <Link href={`/events/${eventId}/idealab/new`}>Submit your idea</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              eventId={eventId}
              isOwner={idea.userId === user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
