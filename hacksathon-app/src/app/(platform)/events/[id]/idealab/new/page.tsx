import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IdeaForm } from "@/components/idealab/idea-form";

export const metadata: Metadata = {
  title: "Submit your idea",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Submission form for an IdeaLab entry.
 *
 * If the user already has an idea in this event, we redirect to it
 * server-side — the UNIQUE (event_id, user_id) DB constraint would
 * 409 the POST anyway, but redirecting up front means the form never
 * pretends submission is open when it isn't.
 */
export default async function NewIdeaPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: existing } = await supabase
    .from("ideas")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/events/${eventId}/idealab/${existing.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href={`/events/${eventId}/idealab`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to IdeaLab
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Submit your idea
        </h1>
        <p className="text-muted-foreground mt-1">
          Commit to a direction. You can keep editing this card as your build
          takes shape.
        </p>
      </div>

      <IdeaForm eventId={eventId} />
    </div>
  );
}
