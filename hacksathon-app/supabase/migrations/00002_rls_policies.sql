-- ============================================
-- Row-Level Security Policies
-- Multi-tenant isolation: all data scoped by organization membership
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is a member of the org that owns an event
CREATE OR REPLACE FUNCTION is_event_member(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events e
    JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = p_event_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
  );
$$;

-- Helper: check if user is an admin of the org that owns an event
CREATE OR REPLACE FUNCTION is_event_admin(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events e
    JOIN organization_members om ON om.organization_id = e.organization_id
    WHERE e.id = p_event_id
    AND om.user_id = auth.uid()
    AND om.status = 'active'
    AND om.role = 'admin'
  );
$$;

-- Helper: check if user is a platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
  );
$$;

-- ============================================
-- Profiles: users can read any profile, update their own
-- ============================================
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- ============================================
-- Organizations: members can read, admins can update
-- ============================================
CREATE POLICY "orgs_select" ON organizations FOR SELECT USING (
  id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')
  OR is_platform_admin()
);
CREATE POLICY "orgs_insert" ON organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "orgs_update" ON organizations FOR UPDATE USING (
  id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
  OR is_platform_admin()
);

-- ============================================
-- Organization Members: org members can read, admins can manage
-- ============================================
CREATE POLICY "members_select" ON organization_members FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')
  OR is_platform_admin()
);
CREATE POLICY "members_insert" ON organization_members FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
  OR is_platform_admin()
);
CREATE POLICY "members_update" ON organization_members FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
  OR is_platform_admin()
);

-- ============================================
-- Events: org members can read, admins can manage
-- ============================================
CREATE POLICY "events_select" ON events FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active')
  OR (public_showcase = true)
  OR is_platform_admin()
);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
);
CREATE POLICY "events_update" ON events FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active')
  OR is_platform_admin()
);

-- ============================================
-- Blocks: members read, admins manage
-- ============================================
CREATE POLICY "blocks_select" ON blocks FOR SELECT USING (is_event_member(event_id) OR is_platform_admin());
CREATE POLICY "blocks_insert" ON blocks FOR INSERT WITH CHECK (is_event_admin(event_id));
CREATE POLICY "blocks_update" ON blocks FOR UPDATE USING (is_event_admin(event_id));
CREATE POLICY "blocks_delete" ON blocks FOR DELETE USING (is_event_admin(event_id));

-- ============================================
-- Award Categories: members read, admins manage
-- ============================================
CREATE POLICY "award_cats_select" ON award_categories FOR SELECT USING (is_event_member(event_id) OR is_platform_admin());
CREATE POLICY "award_cats_insert" ON award_categories FOR INSERT WITH CHECK (is_event_admin(event_id));
CREATE POLICY "award_cats_update" ON award_categories FOR UPDATE USING (is_event_admin(event_id));
CREATE POLICY "award_cats_delete" ON award_categories FOR DELETE USING (is_event_admin(event_id));

-- ============================================
-- Reflection Questions: members read, admins manage
-- ============================================
CREATE POLICY "ref_q_select" ON reflection_questions FOR SELECT USING (is_event_member(event_id) OR is_platform_admin());
CREATE POLICY "ref_q_insert" ON reflection_questions FOR INSERT WITH CHECK (is_event_admin(event_id));
CREATE POLICY "ref_q_update" ON reflection_questions FOR UPDATE USING (is_event_admin(event_id));

-- ============================================
-- Ideas: members read/create, owners update
-- ============================================
CREATE POLICY "ideas_select" ON ideas FOR SELECT USING (is_event_member(event_id) OR is_platform_admin());
CREATE POLICY "ideas_insert" ON ideas FOR INSERT WITH CHECK (is_event_member(event_id) AND user_id = auth.uid());
CREATE POLICY "ideas_update" ON ideas FOR UPDATE USING (user_id = auth.uid() OR is_event_admin(event_id));

-- ============================================
-- Idea Sparks: members can spark
-- ============================================
CREATE POLICY "sparks_select" ON idea_sparks FOR SELECT USING (true);
CREATE POLICY "sparks_insert" ON idea_sparks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sparks_delete" ON idea_sparks FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- Idea Comments: members can read/create
-- ============================================
CREATE POLICY "comments_select" ON idea_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON idea_comments FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- Documents: owners manage, members read shared
-- ============================================
CREATE POLICY "docs_select" ON documents FOR SELECT USING (
  user_id = auth.uid()
  OR (idea_id IN (SELECT id FROM ideas WHERE is_event_member(event_id)))
  OR (share_slug IS NOT NULL)
  OR is_platform_admin()
);
CREATE POLICY "docs_insert" ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "docs_update" ON documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "docs_delete" ON documents FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- Doc Conversations: linked to document owner
-- ============================================
CREATE POLICY "convos_select" ON doc_conversations FOR SELECT USING (
  document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
);
CREATE POLICY "convos_insert" ON doc_conversations FOR INSERT WITH CHECK (
  document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
);
CREATE POLICY "convos_update" ON doc_conversations FOR UPDATE USING (
  document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
);

-- ============================================
-- Voting Config: admins manage
-- ============================================
CREATE POLICY "voting_cfg_select" ON voting_config FOR SELECT USING (is_event_member(event_id) OR is_platform_admin());
CREATE POLICY "voting_cfg_update" ON voting_config FOR UPDATE USING (is_event_admin(event_id));

-- ============================================
-- Votes: members vote
-- ============================================
CREATE POLICY "votes_select" ON votes FOR SELECT USING (is_event_admin(event_id) OR user_id = auth.uid());
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (is_event_member(event_id) AND user_id = auth.uid());
CREATE POLICY "votes_update" ON votes FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- Awards: members read, admins manage
-- ============================================
CREATE POLICY "awards_select" ON awards FOR SELECT USING (is_event_member(event_id) OR is_platform_admin());
CREATE POLICY "awards_insert" ON awards FOR INSERT WITH CHECK (is_event_admin(event_id));
CREATE POLICY "awards_update" ON awards FOR UPDATE USING (is_event_admin(event_id));

-- ============================================
-- Excluded Projects: admins manage
-- ============================================
CREATE POLICY "excluded_select" ON excluded_projects FOR SELECT USING (is_event_member(event_id));
CREATE POLICY "excluded_insert" ON excluded_projects FOR INSERT WITH CHECK (is_event_admin(event_id));
CREATE POLICY "excluded_delete" ON excluded_projects FOR DELETE USING (is_event_admin(event_id));

-- ============================================
-- Reflections: members submit, admins feature
-- ============================================
CREATE POLICY "reflections_select" ON reflections FOR SELECT USING (
  user_id = auth.uid() OR is_event_admin(event_id) OR (is_featured = true AND is_event_member(event_id))
);
CREATE POLICY "reflections_insert" ON reflections FOR INSERT WITH CHECK (is_event_member(event_id) AND user_id = auth.uid());
CREATE POLICY "reflections_update" ON reflections FOR UPDATE USING (user_id = auth.uid() OR is_event_admin(event_id));

-- ============================================
-- Platform Admins: only platform admins can read
-- ============================================
CREATE POLICY "platform_admins_select" ON platform_admins FOR SELECT USING (user_id = auth.uid() OR is_platform_admin());

-- ============================================
-- Event Templates: everyone reads defaults, platform admins manage
-- ============================================
CREATE POLICY "templates_select" ON event_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert" ON event_templates FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "templates_update" ON event_templates FOR UPDATE USING (is_platform_admin());
