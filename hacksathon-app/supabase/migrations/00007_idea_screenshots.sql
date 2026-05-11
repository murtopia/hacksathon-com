-- ============================================
-- Milestone 2: IdeaLab screenshot storage
-- Public-read bucket for final-build screenshots. Final screenshots
-- end up on the public results page later (deferred polish), so
-- public-read is the right shape from the start.
-- ============================================

-- Path convention: {event_id}/{user_id}/{filename}
--   - foldername[1] = event_id (used for RLS membership check)
--   - foldername[2] = user_id  (must match auth.uid())
-- This keeps the policies one-liners and makes browsing by event
-- straightforward in the Supabase dashboard.

INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-screenshots', 'idea-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any prior versions so re-running the migration is idempotent.
DROP POLICY IF EXISTS "idea_screenshots_insert" ON storage.objects;
DROP POLICY IF EXISTS "idea_screenshots_select" ON storage.objects;
DROP POLICY IF EXISTS "idea_screenshots_update" ON storage.objects;
DROP POLICY IF EXISTS "idea_screenshots_delete" ON storage.objects;

-- Insert: owner uploads only into their own folder, only for events
-- they're a member of. Reuses is_event_member() from 00002_rls_policies.
CREATE POLICY "idea_screenshots_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'idea-screenshots'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND is_event_member(((storage.foldername(name))[1])::uuid)
  );

-- Select: public read because the bucket itself is public.
-- Policy here is a belt-and-suspenders in case the bucket is ever
-- flipped to private later — we still want anonymous reads.
CREATE POLICY "idea_screenshots_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'idea-screenshots');

-- Update: owner can replace their own files.
CREATE POLICY "idea_screenshots_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'idea-screenshots'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Delete: owner can remove their own files.
CREATE POLICY "idea_screenshots_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'idea-screenshots'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
