import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Top-level `/idealab` shim.
 *
 * Under the one-org-one-event model there's no shared IdeaLab - each
 * event has its own IdeaLab at `/[slug]/idealab`. This route exists
 * only to keep older inbound links (Resend invite emails, marketing
 * page links) working: it resolves the user's most-recent event and
 * forwards to its IdeaLab, falling back to `/dashboard` for users
 * without an event.
 */
export default async function IdealabRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/idealab");

  const { data: event } = await supabase
    .from("events")
    .select("id, vanity_slug")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; vanity_slug: string | null }>();

  if (!event) redirect("/dashboard");
  if (event.vanity_slug) redirect(`/${event.vanity_slug}/idealab`);
  redirect(`/events/${event.id}`);
}
