-- ============================================
-- Backfill events.vanity_slug for existing events
--
-- The slug-first refactor makes every participant + admin URL live
-- under `/[slug]/...`. Events created before M6 may still have a NULL
-- vanity_slug — they were reachable via the legacy `/events/[uuid]`
-- routes which we're now redirecting through the slug.
--
-- Strategy: copy the organization's slug onto any event without one.
-- The `events_vanity_slug_unique` constraint kicks in on collision, so
-- the DO block falls back to appending the event-id prefix until it
-- finds a free slot.
-- ============================================

DO $$
DECLARE
  ev RECORD;
  candidate TEXT;
  attempt INT;
BEGIN
  FOR ev IN
    SELECT e.id, e.organization_id, o.slug AS org_slug
    FROM events e
    JOIN organizations o ON o.id = e.organization_id
    WHERE e.vanity_slug IS NULL
  LOOP
    candidate := ev.org_slug;
    attempt := 0;

    WHILE attempt < 6 LOOP
      BEGIN
        UPDATE events
        SET vanity_slug = candidate
        WHERE id = ev.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        attempt := attempt + 1;
        candidate := ev.org_slug || '-' || SUBSTRING(ev.id::TEXT FROM 1 FOR 4 + attempt);
      END;
    END LOOP;
  END LOOP;
END $$;
