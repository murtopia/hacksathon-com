-- ============================================
-- Fix: infinite recursion in RLS policies for organization_members,
-- organizations, and events.
--
-- Root cause: the policies subselect on organization_members from
-- within (or transitively through) organization_members' own policy,
-- so Postgres trips its recursive-policy guard and the entire query
-- returns 500. is_event_member() / is_event_admin() already side-step
-- this via SECURITY DEFINER; we add equivalent helpers for plain org
-- membership and rewrite the four offending policies.
-- ============================================

-- ----- Helpers -------------------------------------------------------
-- Both functions are SECURITY DEFINER so the body bypasses RLS on
-- organization_members (the function owner has BYPASSRLS).
-- search_path is locked to '' per the function_search_path_mutable
-- advisor finding from the security linter.

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
  );
$$;

-- Also lock search_path on the existing helpers; they had the
-- function_search_path_mutable advisor warning.
CREATE OR REPLACE FUNCTION public.is_event_member(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = p_event_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_admin(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = p_event_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND om.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  );
$$;

-- ----- organizations -------------------------------------------------
DROP POLICY IF EXISTS "orgs_select" ON organizations;
DROP POLICY IF EXISTS "orgs_update" ON organizations;

CREATE POLICY "orgs_select" ON organizations FOR SELECT USING (
  public.is_org_member(id) OR public.is_platform_admin()
);

CREATE POLICY "orgs_update" ON organizations FOR UPDATE USING (
  public.is_org_admin(id) OR public.is_platform_admin()
);

-- ----- organization_members -----------------------------------------
DROP POLICY IF EXISTS "members_select" ON organization_members;
DROP POLICY IF EXISTS "members_insert" ON organization_members;
DROP POLICY IF EXISTS "members_update" ON organization_members;

CREATE POLICY "members_select" ON organization_members FOR SELECT USING (
  public.is_org_member(organization_id) OR public.is_platform_admin()
);

CREATE POLICY "members_insert" ON organization_members FOR INSERT WITH CHECK (
  public.is_org_admin(organization_id) OR public.is_platform_admin()
);

CREATE POLICY "members_update" ON organization_members FOR UPDATE USING (
  public.is_org_admin(organization_id) OR public.is_platform_admin()
);

-- ----- events --------------------------------------------------------
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;

CREATE POLICY "events_select" ON events FOR SELECT USING (
  public.is_org_member(organization_id)
  OR public_showcase = true
  OR public.is_platform_admin()
);

CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (
  public.is_org_admin(organization_id)
);

CREATE POLICY "events_update" ON events FOR UPDATE USING (
  public.is_org_admin(organization_id) OR public.is_platform_admin()
);
