-- ============================================
-- M6: Organizer Admin
--
-- Adds:
--   1. event_invitations table — tracks pending/accepted/revoked invites
--      so organizers can send branded emails before recipients have any
--      account. Token is single-use, unique, with a default 30-day TTL.
--      RLS gates admins reading their own event's invites; the accept
--      endpoint runs through the admin client so RLS doesn't block the
--      pre-account caller.
--   2. event-logos storage bucket — public-read, write requires
--      is_event_admin. Path convention: {event_id}/{uuid}.{ext}.
-- ============================================

-- ============================================
-- event_invitations
-- ============================================
CREATE TABLE IF NOT EXISTS event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT event_invitations_status_check
    CHECK (status IN ('pending','accepted','revoked','expired'))
);

-- One pending invite per (event, lowercased email). Re-inviting the
-- same address upserts: the API deletes the prior row first if it's
-- still pending. Accepted rows stay around as audit trail.
CREATE UNIQUE INDEX IF NOT EXISTS uq_event_invitations_event_email_pending
  ON event_invitations (event_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_event_invitations_event
  ON event_invitations (event_id);

CREATE INDEX IF NOT EXISTS idx_event_invitations_token
  ON event_invitations (token);

COMMENT ON TABLE event_invitations IS
  'Pending and historical event invitations. Token is single-use; the accept-invite endpoint marks status=''accepted'' on success.';

ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything against their own event's invitations.
-- The public accept-invite endpoint uses the admin Supabase client and
-- doesn't depend on these policies.
DROP POLICY IF EXISTS "event_invitations_select" ON event_invitations;
CREATE POLICY "event_invitations_select" ON event_invitations FOR SELECT
  USING (is_event_admin(event_id));

DROP POLICY IF EXISTS "event_invitations_insert" ON event_invitations;
CREATE POLICY "event_invitations_insert" ON event_invitations FOR INSERT
  WITH CHECK (is_event_admin(event_id));

DROP POLICY IF EXISTS "event_invitations_update" ON event_invitations;
CREATE POLICY "event_invitations_update" ON event_invitations FOR UPDATE
  USING (is_event_admin(event_id));

DROP POLICY IF EXISTS "event_invitations_delete" ON event_invitations;
CREATE POLICY "event_invitations_delete" ON event_invitations FOR DELETE
  USING (is_event_admin(event_id));

-- ============================================
-- event-logos storage bucket
-- ============================================
-- Public-read so the participant home and vanity URL can render the
-- logo without a signed URL. Path convention: {event_id}/{uuid}.{ext}.
-- foldername(name)[1] = event_id, used to gate writes via is_event_admin.
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-logos', 'event-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "event_logos_select" ON storage.objects;
DROP POLICY IF EXISTS "event_logos_insert" ON storage.objects;
DROP POLICY IF EXISTS "event_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "event_logos_delete" ON storage.objects;

CREATE POLICY "event_logos_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'event-logos');

CREATE POLICY "event_logos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-logos'
    AND is_event_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "event_logos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-logos'
    AND is_event_admin(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "event_logos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-logos'
    AND is_event_admin(((storage.foldername(name))[1])::uuid)
  );
