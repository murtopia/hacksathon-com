-- ============================================
-- Re-key the idea-screenshots bucket: path is now {idea_id}/{uuid}.{ext}
-- and write/delete is gated by ownership of the parent ideas row.
--
-- Previously (00007) the path was {event_id}/{user_id}/screenshot.{ext}
-- with RLS via is_event_member(). The new scheme means:
--   - filenames are unique by construction (no upsert, no cache-buster)
--   - removing a screenshot doesn't risk colliding with someone else's
--   - cleanup is trivial: delete the whole {idea_id}/ folder when an
--     idea is deleted
-- ============================================

DROP POLICY IF EXISTS "idea_screenshots_insert" ON storage.objects;
DROP POLICY IF EXISTS "idea_screenshots_select" ON storage.objects;
DROP POLICY IF EXISTS "idea_screenshots_update" ON storage.objects;
DROP POLICY IF EXISTS "idea_screenshots_delete" ON storage.objects;

-- Public read so the gallery thumbnails and the public results page
-- (future) can resolve URLs without auth.
CREATE POLICY "idea_screenshots_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'idea-screenshots');

-- Insert: only into a folder whose name matches an ideas.id owned by
-- the caller. Defensive: also requires the row to exist before the
-- upload, so we can't write into arbitrary {uuid} folders.
CREATE POLICY "idea_screenshots_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'idea-screenshots'
    AND EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id::text = (storage.foldername(name))[1]
        AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "idea_screenshots_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'idea-screenshots'
    AND EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id::text = (storage.foldername(name))[1]
        AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "idea_screenshots_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'idea-screenshots'
    AND EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id::text = (storage.foldername(name))[1]
        AND ideas.user_id = auth.uid()
    )
  );
