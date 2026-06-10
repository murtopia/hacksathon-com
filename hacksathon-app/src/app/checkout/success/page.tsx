import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { provisionPaidEvent } from "@/lib/billing/provision";
import { sendPurchaseWelcomeEmail } from "@/lib/email/send-purchase-welcome";

export const metadata: Metadata = {
  title: "Setting up your Hacks-a-Thon",
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

/**
 * Post-checkout landing.
 *
 * Webhook-primary, but we also fulfill here as an idempotent fallback so
 * the buyer is never stranded if the webhook is delayed or misconfigured
 * in dev. We retrieve the session, confirm it's paid (or $0-promo), run
 * the same idempotent `provisionPaidEvent`, then bounce into the admin
 * (Hacky Helper). Provisioning keyed on the session id guarantees the
 * webhook and this page can't double-create.
 */
export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return <PendingShell title="We couldn't find your checkout session." />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/checkout/success?session_id=${sessionId}`);
  }

  let session: Stripe.Checkout.Session;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "discounts.promotion_code"],
    });
  } catch {
    return (
      <PendingShell title="We're confirming your payment. This can take a moment." />
    );
  }

  const settled =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";

  if (!settled) {
    return (
      <PendingShell title="Your payment is processing. Refresh in a few seconds." />
    );
  }

  const metadata = session.metadata ?? {};
  const userId = metadata.userId || session.client_reference_id || user.id;
  const orgName = metadata.orgName || "";
  const eventTitle = metadata.eventTitle || undefined;
  const seatCount = Number(metadata.seatCount || "0");

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);
  const firstDiscount = session.discounts?.[0]?.promotion_code;
  const discountCode =
    firstDiscount && typeof firstDiscount !== "string"
      ? firstDiscount.code
      : null;

  if (!orgName || !Number.isFinite(seatCount) || seatCount < 1) {
    return (
      <PendingShell title="We're finishing your setup. Hang tight and refresh in a moment." />
    );
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
    return (
      <PendingShell title="We're finishing your setup. Hang tight and refresh in a moment." />
    );
  }

  // Fallback send: only fires if this page (not the webhook) provisioned.
  // Fail-soft and must not block the redirect into the admin.
  if (!result.alreadyProvisioned) {
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

  redirect(`/${result.slug}/admin`);
}

function PendingShell({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <p className="mono-label">Hacksathon.com</p>
        <h1 className="font-serif text-2xl leading-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          If this doesn&apos;t resolve on its own, head to your{" "}
          <Link href="/dashboard" className="underline-offset-4 hover:underline">
            dashboard
          </Link>{" "}
          - your event will appear there once payment confirms.
        </p>
      </div>
    </main>
  );
}
