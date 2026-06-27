-- ============================================
-- 00034 Seven2 showcase: mark all entries Complete
--
-- Two parts:
-- 1. Relax the demo-assets gate (ideas_completed_requires_demo_assets)
--    so it only applies to real, user-owned ideas. Seeded/historical
--    snapshot rows (user_id IS NULL, e.g. the Seven2 case study) are
--    exempt, mirroring how 00031 relaxed user_id to nullable for the
--    same data. Real participants are still gated, both here and in the
--    app layer (api/ideas/[id]/route.ts).
-- 2. Mark every remaining Seven2 idea Complete. Several lack a live_url
--    (and one lacks a screenshot); per the showcase owner these should
--    still read as Complete, which the exemption above now allows.
--
-- Idempotent: the constraint is dropped/re-added and the update is
-- scoped to "not already completed".
-- ============================================

ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_completed_requires_demo_assets;
ALTER TABLE ideas ADD CONSTRAINT ideas_completed_requires_demo_assets
  CHECK (
    status <> 'completed'
    OR (live_url IS NOT NULL AND final_screenshot_url IS NOT NULL)
    OR user_id IS NULL
  );

UPDATE ideas
SET status = 'completed'
WHERE event_id = (SELECT id FROM events WHERE vanity_slug = 'seven2')
  AND status <> 'completed';
