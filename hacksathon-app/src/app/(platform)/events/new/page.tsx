import { redirect } from "next/navigation";

/**
 * Legacy free event-creation entry point.
 *
 * Superseded by the purchase-first flow: events are now provisioned only
 * after a successful Stripe Checkout (see `/checkout` + the webhook).
 * This route stays as a permanent redirect so any old bookmarks/links
 * land on checkout instead of a now-removed free form.
 */
export default function NewEventPage() {
  redirect("/checkout");
}
