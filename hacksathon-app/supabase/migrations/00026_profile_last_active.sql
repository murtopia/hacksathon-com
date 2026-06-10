-- ============================================
-- Activity tracking on profiles
-- ============================================
--
-- `auth.users.last_sign_in_at` only updates on a true sign-in event
-- (signInWithPassword, OTP, etc.) and not on session refresh, so it
-- can lag by weeks for a user who's "active every day" via cookies.
--
-- We want roster admins to see real activity ("Last seen 5 minutes
-- ago") rather than credential events ("Last signed in 1 month ago"),
-- so we add a `last_active_at` column on profiles and touch it from
-- middleware on every authenticated request. To keep DB writes
-- bounded we throttle the touch to at most once per minute per user.

BEGIN;

-- 1. Column + index ------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_profiles_last_active_at
  ON public.profiles (last_active_at DESC NULLS LAST);

-- 2. Backfill from auth.users.last_sign_in_at ----------------------
--
-- So the column isn't fully null on launch. After day 1, real
-- activity overwrites this.
UPDATE public.profiles AS p
SET    last_active_at = u.last_sign_in_at
FROM   auth.users AS u
WHERE  p.id = u.id
  AND  p.last_active_at IS NULL
  AND  u.last_sign_in_at IS NOT NULL;

-- 3. Throttled touch RPC -------------------------------------------
--
-- Called by middleware on every authenticated request. The WHERE
-- clause is the throttle: rows whose last_active_at is fresh enough
-- silently no-op. Runs as the caller (no SECURITY DEFINER) because
-- the existing `profiles_update_own` RLS policy already lets a user
-- update their own row.

CREATE OR REPLACE FUNCTION public.touch_my_activity()
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET    last_active_at = NOW()
  WHERE  id = uid
    AND  (
      last_active_at IS NULL
      OR last_active_at < NOW() - INTERVAL '1 minute'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_my_activity() TO authenticated;

COMMIT;
