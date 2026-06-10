import { redirect } from "next/navigation";

/**
 * Legacy /events index.
 *
 * Under the one-org-one-event model there's no need for a multi-event
 * listing - the dashboard already redirects every user with an event
 * straight to `/[slug]`, and users without an event need the "create
 * event" CTA on `/dashboard`. This page just forwards to `/dashboard`
 * which handles both cases.
 */
export default function LegacyEventsIndex() {
  redirect("/dashboard");
}
