-- ============================================
-- User avatars storage bucket.
--
-- Public-read so headers and gallery cards across the app can resolve
-- avatar URLs without an auth round-trip (the same shape we use for
-- idea-screenshots). Writes are gated on the path's first folder
-- segment matching the caller's auth.uid(), so every user can only
-- write into their own folder.
--
-- Path convention: {user_id}/{uuid}.{ext}
--   - foldername[1] = user_id (must match auth.uid())
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Idempotent re-runs.
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;

-- Public read so we can render avatars from anonymous surfaces (showcase
-- pages, marketing OG images later, etc.).
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Each user can only write under their own {user_id}/ folder.
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
