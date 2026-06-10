-- 00025_join_link_and_pending_members.sql
--
-- Adds the shareable per-event join link plus the `pending` membership
-- state required for the approval queue. Backward-compatible: existing
-- rows are untouched, and the column / enum migrations preserve current
-- behavior for callers that don't know about the new value.

-- 1. Event-scoped shareable join token. NULL = link disabled.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS join_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_events_join_token
  ON events (join_token)
  WHERE join_token IS NOT NULL;

COMMENT ON COLUMN events.join_token IS
  'When set, /join/{token} is a public page where anyone can request to join the event. Lands new members as status=pending until an admin approves. NULL means the link is disabled.';

-- 2. Add `pending` to organization_members.status.
--
-- We migrate the column off the legacy `member_status` ENUM and onto
-- TEXT + CHECK so we can both add the new value in a single migration
-- (Postgres won't let you use a newly-added ENUM value in the same
-- transaction it's declared) and freely extend status in the future.
ALTER TABLE organization_members
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE organization_members
  ALTER COLUMN status TYPE TEXT USING status::text;

ALTER TABLE organization_members
  ALTER COLUMN status SET DEFAULT 'invited';

ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_status_check;

ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_status_check
  CHECK (status IN ('invited', 'active', 'removed', 'pending'));

COMMENT ON COLUMN organization_members.status IS
  'invited (legacy default) | active (full member) | removed (kicked / left) | pending (requested via join link, awaiting admin approval).';

-- 3. Partial index for the pending-approvals queue read path.
CREATE INDEX IF NOT EXISTS ix_org_members_pending
  ON organization_members (organization_id)
  WHERE status = 'pending';

-- Note: the now-unused `member_status` ENUM type is intentionally left
-- in place. Dropping it requires confirming nothing else references it
-- (functions, views, other tables). Safe to drop in a follow-up migration
-- once a sweep confirms it's orphaned.
