-- Branded campaign short links (hacksathon.com/go/<slug>).
--
-- Managed from the Murtopolis platform admin (Links tab) and served by
-- the /go/[slug] route handler, replacing the hard-coded next.config.ts
-- redirect so new links don't need a deploy.
--
-- RLS is enabled with no policies on purpose: every read/write goes
-- through the service-role client, the same access model as the rest of
-- the platform-admin data (gating happens in the app layer via
-- is_platform_admin()).

CREATE TABLE IF NOT EXISTS public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination text NOT NULL,
  click_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Atomic, race-safe click counter for the redirect handler.
CREATE OR REPLACE FUNCTION public.increment_short_link_clicks(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.short_links
  SET click_count = click_count + 1, updated_at = now()
  WHERE slug = p_slug;
$$;

-- Seed the live LinkedIn campaign link so it keeps working the moment
-- the next.config.ts redirect is removed. Idempotent.
INSERT INTO public.short_links (slug, destination)
VALUES (
  'agency-launch',
  '/seven2?utm_source=linkedin&utm_medium=organic&utm_campaign=agency-launch-q3&utm_content=founder-quote-v1'
)
ON CONFLICT (slug) DO NOTHING;
