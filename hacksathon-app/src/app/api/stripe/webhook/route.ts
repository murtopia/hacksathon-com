import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionPaidEvent } from "@/lib/billing/provision";
import { sendPurchaseWelcomeEmail } from "@/lib/email/send-purchase-welcome";
import { captureServer } from "@/lib/analytics/server";
import { AnalyticsEvent } from "@/lib/analytics/events";

// Stripe signature verification needs the raw body; force Node runtime.
export const runtime = "nodejs";

/**
 * Stripe webhook.
 *
 * Primary fulfillment path for the purchase-first flow. On
 * `checkout.session.completed` (paid or $0-promo) we provision the org +
 * event from the session metadata. Provisioning is idempotent on the
 * Checkout Session id, so a replay (or a race with the success-page
 * fallback) is safe. `charge.refunded` flips the event to refunded /
 * cancelled.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature.";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      }
      default:
        // Ignore everything else.
        break;
    }
  } catch (e) {
    // Returning 500 tells Stripe to retry - desirable for transient
    // provisioning failures since the handler is idempotent.
    const message = e instanceof Error ? e.message : "Webhook handler error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Only fulfill once payment is settled. $0 promo sessions come through
  // as 'no_payment_required'.
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return;
  }

  const metadata = session.metadata ?? {};
  const userId = metadata.userId || session.client_reference_id || "";
  const orgName = metadata.orgName || "";
  const eventTitle = metadata.eventTitle || undefined;
  const seatCount = Number(metadata.seatCount || "0");

  if (!userId || !orgName || !Number.isFinite(seatCount) || seatCount < 1) {
    throw new Error(
      `checkout.session.completed missing required metadata (session ${session.id}).`,
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  // Promotion code applied at checkout (if any). The webhook event's
  // session usually carries promotion_code as a bare id, so retrieve the
  // expanded session to recover the human-readable code. Best-effort.
  let discountCode: string | null = null;
  const inlinePromo = session.discounts?.[0]?.promotion_code;
  if (inlinePromo && typeof inlinePromo !== "string") {
    discountCode = inlinePromo.code;
  } else if (inlinePromo) {
    try {
      const stripe = getStripe();
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["discounts.promotion_code"],
      });
      const promo = full.discounts?.[0]?.promotion_code;
      if (promo && typeof promo !== "string") discountCode = promo.code;
    } catch {
      // Leave discountCode null - it's a label, not load-bearing.
    }
  }

  const result = await provisionPaidEvent({
    userId,
    orgName,
    eventTitle,
    seatCount,
    checkoutSessionId: session.id,
    stripeCustomerId,
    paymentIntentId,
    discountCode,
    amountPaidCents: session.amount_total ?? 0,
  });

  if ("error" in result) {
    throw new Error(`Provisioning failed for ${session.id}: ${result.error}`);
  }

  // Branded confirmation + welcome email. Gate on the freshly-provisioned
  // flag so the webhook and the success-page fallback never both send.
  // Fail-soft inside the helper - never let email block the 200.
  if (!result.alreadyProvisioned) {
    const amountPaidCents = session.amount_total ?? 0;
    await captureServer({
      distinctId: userId,
      event: AnalyticsEvent.PurchaseCompleted,
      properties: {
        paid: amountPaidCents > 0,
        amount_paid_cents: amountPaidCents,
        discount_code: discountCode,
        seat_count: seatCount,
        event_id: result.eventId,
        slug: result.slug,
      },
    });

    await sendPurchaseWelcomeEmail({
      userId,
      orgName,
      eventTitle: eventTitle || `${orgName} Hacks-a-Thon`,
      slug: result.slug,
      seatLimit: seatCount,
      amountTotalCents: session.amount_total ?? null,
      discountCode,
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);
  if (!paymentIntentId) return;

  const admin = createAdminClient();
  await admin
    .from("events")
    .update({ payment_status: "refunded", status: "cancelled" })
    .eq("stripe_payment_intent_id", paymentIntentId);
}
