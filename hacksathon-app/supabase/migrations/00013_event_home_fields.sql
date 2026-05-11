-- ============================================
-- Event home fields
-- M3: Participant event home + vanity URL landing.
--
-- Adds organizer-customizable identity for an event:
--   welcome_message      Optional override copy for the event home header.
--   welcome_video_url    Optional embed URL (YouTube / Vimeo / direct mp4).
--   logo_url             Event-specific logo. Falls back to the organization
--                        logo when null.
--   vanity_slug          Optional public-facing slug used at
--                        hacksathon.com/{vanity_slug}. Unique across all
--                        events. Reserved-word protection is enforced in the
--                        application layer (lib/routing/reserved-slugs.ts).
-- ============================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS welcome_video_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS vanity_slug TEXT;

-- Case-insensitive uniqueness on vanity_slug. Allowing NULLs (most events
-- won't have one) while ensuring no two events share the same slug.
CREATE UNIQUE INDEX IF NOT EXISTS events_vanity_slug_unique
  ON events (lower(vanity_slug))
  WHERE vanity_slug IS NOT NULL;

COMMENT ON COLUMN events.welcome_message IS
  'Optional welcome copy shown on the participant event home. Defaults to a generic greeting when null.';
COMMENT ON COLUMN events.welcome_video_url IS
  'Optional video URL (YouTube/Vimeo/mp4) embedded on the event home header.';
COMMENT ON COLUMN events.logo_url IS
  'Event-specific logo. Falls back to the organization logo when null.';
COMMENT ON COLUMN events.vanity_slug IS
  'Optional public-facing slug used at hacksathon.com/{slug}. Reserved words are filtered in the app.';
