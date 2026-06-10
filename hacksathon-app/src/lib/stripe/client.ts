import Stripe from "stripe";

/**
 * Server-only Stripe client.
 *
 * We use hosted Stripe Checkout (redirect) + webhooks, so the only
 * secrets needed are `STRIPE_SECRET_KEY` (API calls + session creation)
 * and `STRIPE_WEBHOOK_SECRET` (signature verification). No publishable
 * key / client-side Stripe.js is required.
 *
 * The instance is created lazily so that importing this module never
 * crashes a route that doesn't actually touch Stripe when the key is
 * unset (e.g. local dev before the key is pasted in). The first real
 * call throws a clear error instead.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (and the Vercel project env) before using checkout.",
    );
  }

  cached = new Stripe(key, {
    // Pin to the version this SDK build ships with for reproducible behavior.
    apiVersion: "2026-03-25.dahlia",
    appInfo: { name: "Hacksathon.com" },
  });
  return cached;
}

/** True when Stripe is configured - lets UI degrade gracefully. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
