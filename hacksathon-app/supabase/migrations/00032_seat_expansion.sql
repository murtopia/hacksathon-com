-- Post-purchase seat expansion ("Add participants").
--
-- Two pieces:
--
-- 1. organization_members.is_participating - whether an active member
--    occupies a paid participant seat. Participants are always true;
--    admins/organizers default to true but can opt out (they're running
--    the event, not necessarily competing). Seat usage counts only active
--    members where is_participating = true.
--
-- 2. event_seat_purchases - an append-only ledger of add-on seat
--    purchases. The original purchase is tracked on events
--    (stripe_checkout_session_id is its unique idempotency key); add-ons
--    can't reuse that single column, so each top-up Stripe session lands
--    here. The UNIQUE session id makes applying an add-on idempotent
--    across the webhook + success-page race, exactly like provisioning.

ALTER TABLE organization_members
  ADD COLUMN is_participating BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN organization_members.is_participating IS
  'Whether this active member occupies a paid participant seat. Participants are always true; admins may opt out. Seat usage = active members with is_participating = true.';

CREATE TABLE event_seat_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  seats_added INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE event_seat_purchases IS
  'Append-only ledger of post-purchase seat top-ups. One row per add-on Stripe Checkout Session; stripe_checkout_session_id is the unique idempotency key for applying the increase.';

CREATE INDEX event_seat_purchases_event_id_idx
  ON event_seat_purchases (event_id);

-- Service-role-only table (mutated exclusively by the admin client in the
-- webhook / success fallback). Enable RLS with no policies so anon/auth
-- roles get no access; the service role bypasses RLS.
ALTER TABLE event_seat_purchases ENABLE ROW LEVEL SECURITY;
