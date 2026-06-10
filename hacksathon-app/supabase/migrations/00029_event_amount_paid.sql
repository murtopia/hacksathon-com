-- Record the amount actually charged for an event (Stripe amount_total).
--
-- `price_cents` (migration 00003) is the LIST price for the seat tier. It
-- does not reflect discounts: a 100%-off promo order still carries the
-- full list price. To report real revenue and tell "paid" from "comped"
-- (free via promo), we store what Stripe actually collected.
--
--   amount_paid_cents = 0      -> comped (100%-off promo, no charge)
--   amount_paid_cents > 0      -> real paid order
--   amount_paid_cents IS NULL  -> demo / never went through checkout

ALTER TABLE events ADD COLUMN amount_paid_cents INTEGER;

COMMENT ON COLUMN events.amount_paid_cents IS
  'Actual amount collected by Stripe (amount_total) in cents. 0 = comped/promo, NULL = demo/no checkout. Source of truth for revenue (price_cents is list price only).';

-- Backfill existing paid events. Every current paid event was a 100%-off
-- promo (no payment intent), so the collected amount is 0.
UPDATE events
  SET amount_paid_cents = 0
  WHERE payment_status = 'paid'
    AND stripe_payment_intent_id IS NULL;
