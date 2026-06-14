"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import {
  priceForSeats,
  priceForSeatIncrease,
  isSelfServeSeatCount,
  MAX_SELF_SERVE_SEATS,
} from "@/lib/billing/pricing";
import { siteBaseUrl } from "@/lib/routing/site-url";

export type CheckoutActionResult = { url: string } | { error: string };

/**
 * Build a Stripe Checkout Session for a purchase-first event.
 *
 * The buyer must be signed in: we tie the purchase to their Supabase
 * user via `client_reference_id` and carry the org name + seat count in
 * session metadata so the webhook (and the success-page fallback) can
 * provision the event after payment. Pricing is recomputed server-side
 * from the seat count - the client never sends an amount.
 */
export async function createCheckoutSession(
  formData: FormData,
): Promise<CheckoutActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in before purchasing." };
  }

  const orgName = String(formData.get("orgName") ?? "").trim();
  const eventTitle = String(formData.get("eventTitle") ?? "").trim();
  const seatCountRaw = Number(formData.get("seatCount"));

  if (!orgName) return { error: "Company or team name is required." };
  if (!Number.isFinite(seatCountRaw) || seatCountRaw < 1) {
    return { error: "Enter how many people you expect (at least 1)." };
  }
  if (!isSelfServeSeatCount(seatCountRaw)) {
    return {
      error: `Events over ${MAX_SELF_SERVE_SEATS} participants are custom - email support@hacksathon.com.`,
    };
  }

  let amountCents: number;
  let seats: number;
  try {
    const quote = priceForSeats(seatCountRaw);
    amountCents = quote.amountCents;
    seats = quote.seats;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid participant count.",
    };
  }

  const base = siteBaseUrl();

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return {
      error:
        "Payments aren't configured yet. Add STRIPE_SECRET_KEY to the environment.",
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Hacks-a-Thon event - up to ${seats} participants`,
              description:
                "One full Hacks-a-Thon on Hacksathon.com: all 10 blocks, IdeaLab, AI planning, awards, reflections, and your public showcase.",
            },
          },
        },
      ],
      // Force Stripe to email an official itemized receipt for real
      // payments. Ignored for $0 promo orders (no PaymentIntent created),
      // which is why we also send our own branded confirmation email.
      payment_intent_data: { receipt_email: user.email ?? undefined },
      metadata: {
        userId: user.id,
        orgName,
        eventTitle: eventTitle || `${orgName} Hacks-a-Thon`,
        seatCount: String(seats),
      },
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
    });

    if (!session.url) {
      return { error: "Stripe did not return a checkout URL. Try again." };
    }
    return { url: session.url };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not start checkout. Please try again.",
    };
  }
}

/**
 * Build a Stripe Checkout Session that raises an existing event's seat
 * limit ("Add participants"). The caller must be an admin of the event.
 *
 * The charge is the *difference* in list price between the new total and
 * the current `participant_limit` (see `priceForSeatIncrease`), so a buyer
 * never pays twice for seats they already have. The new total is carried
 * in session metadata (`kind: "add_seats"`) for the webhook / success
 * fallback to apply idempotently against the `event_seat_purchases`
 * ledger.
 */
export async function createAddSeatsCheckoutSession(input: {
  eventId: string;
  newLimit: number;
}): Promise<CheckoutActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in first." };
  }

  const eventId = String(input.eventId ?? "").trim();
  const newLimit = Math.floor(Number(input.newLimit));
  if (!eventId) return { error: "Missing event." };
  if (!Number.isFinite(newLimit) || newLimit < 1) {
    return { error: "Enter a valid new participant total." };
  }

  // Admin-only. Reuse the same SECURITY DEFINER check the API routes use.
  const { data: isAdmin, error: rpcError } = await supabase.rpc(
    "is_event_admin",
    { p_event_id: eventId },
  );
  if (rpcError) return { error: rpcError.message };
  if (!isAdmin) return { error: "Only an event admin can add participants." };

  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from("events")
    .select(
      "id, participant_limit, organization_id, organizations(slug, stripe_customer_id)",
    )
    .eq("id", eventId)
    .maybeSingle<{
      id: string;
      participant_limit: number | null;
      organization_id: string;
      organizations:
        | { slug: string; stripe_customer_id: string | null }
        | { slug: string; stripe_customer_id: string | null }[]
        | null;
    }>();

  if (!eventRow) return { error: "Event not found." };

  const currentLimit = eventRow.participant_limit;
  if (currentLimit === null) {
    return {
      error: "This event has no seat limit to expand. Contact support@hacksathon.com.",
    };
  }

  const orgRel = eventRow.organizations;
  const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
  const slug = org?.slug ?? null;
  const stripeCustomerId = org?.stripe_customer_id ?? null;

  let quote;
  try {
    quote = priceForSeatIncrease(currentLimit, newLimit);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid participant total.",
    };
  }

  const base = siteBaseUrl();

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return {
      error:
        "Payments aren't configured yet. Add STRIPE_SECRET_KEY to the environment.",
    };
  }

  try {
    const successPath = slug
      ? `/${slug}/admin/team?seats_session={CHECKOUT_SESSION_ID}`
      : `/dashboard`;
    const cancelPath = slug ? `/${slug}/admin/team` : `/dashboard`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: user.email ?? undefined }),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: quote.amountCents,
            product_data: {
              name: `Add ${quote.addedSeats} participant${
                quote.addedSeats === 1 ? "" : "s"
              } (up to ${quote.newLimit} total)`,
              description:
                "Additional participant seats for your Hacks-a-Thon on Hacksathon.com.",
            },
          },
        },
      ],
      payment_intent_data: { receipt_email: user.email ?? undefined },
      allow_promotion_codes: true,
      metadata: {
        kind: "add_seats",
        eventId,
        newLimit: String(quote.newLimit),
        addedSeats: String(quote.addedSeats),
        userId: user.id,
      },
      success_url: `${base}${successPath}`,
      cancel_url: `${base}${cancelPath}`,
    });

    if (!session.url) {
      return { error: "Stripe did not return a checkout URL. Try again." };
    }
    return { url: session.url };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not start checkout. Please try again.",
    };
  }
}
