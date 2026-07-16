-- Customer-health roadblock alerts for the Murtopolis owner console.
--
-- Written by the daily /api/cron/customer-health sweep: one row per
-- currently-active flag (unique per event + flag type). Rows are
-- deleted when the flag clears so a recurrence re-alerts; the digest
-- email only mentions flags whose row was newly inserted by a sweep.
--
-- RLS is enabled with no policies on purpose: every read/write goes
-- through the service-role client, same access model as short_links
-- (app-layer gating via the cron secret / is_platform_admin()).

CREATE TABLE IF NOT EXISTS public.platform_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warn', 'info')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (event_id, flag_key)
);

ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;
