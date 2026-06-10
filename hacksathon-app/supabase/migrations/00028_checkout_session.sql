-- Link an event back to the Stripe Checkout Session that paid for it.
--
-- The purchase-first flow provisions the org + event only after a
-- successful Stripe Checkout. `stripe_checkout_session_id` is both the
-- linkage and the idempotency key: provisioning is keyed on it so the
-- webhook and the success-page fallback can race without double-creating
-- an event, and a webhook replay is a no-op.
--
-- The pricing columns this flow uses (participant_limit, price_cents,
-- discount_code, payment_status, stripe_payment_intent_id) already exist
-- from migration 00003; this only adds the session id.

ALTER TABLE events ADD COLUMN stripe_checkout_session_id TEXT;

ALTER TABLE events
  ADD CONSTRAINT events_stripe_checkout_session_id_key
    UNIQUE (stripe_checkout_session_id);

COMMENT ON COLUMN events.stripe_checkout_session_id IS
  'Stripe Checkout Session id that provisioned this event; unique idempotency key for purchase-first provisioning.';
