-- ============================================
-- Migration 00003: Pricing Model Alignment
-- Replaces subscription-based pricing with per-event flat-rate pricing.
-- Source of truth: hacksathon-pricing-strategy.md
--
-- Model: $995 base for up to 25 participants, $30/seat over 25,
--        self-serve max 50, 51+ is custom/contact-us.
-- ============================================

-- 1. New enum for event payment lifecycle
CREATE TYPE event_payment_status AS ENUM ('demo', 'paid', 'completed', 'refunded');

-- 2. Add pricing columns to events
ALTER TABLE events
  ADD COLUMN participant_limit INTEGER,
  ADD COLUMN price_cents INTEGER,
  ADD COLUMN payment_status event_payment_status NOT NULL DEFAULT 'demo',
  ADD COLUMN discount_code TEXT,
  ADD COLUMN stripe_payment_intent_id TEXT;

-- 3. Remove subscription columns from organizations
ALTER TABLE organizations
  DROP COLUMN subscription_tier,
  DROP COLUMN subscription_status;

-- 4. Drop the old enums (no longer referenced)
DROP TYPE subscription_tier;
DROP TYPE subscription_status;
