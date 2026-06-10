"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import {
  priceForSeats,
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
