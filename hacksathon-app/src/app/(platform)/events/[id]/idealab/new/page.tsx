import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IdeaForm } from "@/components/idealab/idea-form";

export const metadata: Metadata = {
  title: "Drop Your Idea",
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
 *
 * The framing of this page is intentionally warmer than the rest of
 * the platform. IdeaLab is where the hackathon's energy starts;
 * pretending it's a serious enterprise form would be a tone mismatch.
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
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/events/${eventId}/idealab`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to IdeaLab
        </Link>
      </div>

      {/* Heading card — sparkle badge + warm subtitle. Visual cue that
          this part of the app is fun, not bureaucratic. */}
      <div className="rounded-lg border bg-muted/30 px-6 py-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-background"
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Drop Your Idea</h1>
        </div>
        <p className="mt-3 text-muted-foreground">
          Keep it short, sweet, and a little bit wild. One spark is all it takes.
        </p>
      </div>

      <IdeaForm eventId={eventId} />
    </div>
  );
}
