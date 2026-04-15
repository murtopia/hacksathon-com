-- ============================================
-- Migration 00004: Planning Sessions, Project Briefs, Build Notes
-- ZERO.Prmptr conversation engine tables.
-- Source of truth: hacksathon-prd-v2.md (lines 997-1050)
-- ============================================

-- ============================================
-- Planning Sessions
-- One per participant per planning attempt.
-- event_id is nullable: null = standalone ZERO.Prmptr context.
-- ============================================
CREATE TABLE planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  build_tool TEXT NOT NULL DEFAULT 'lovable',
  mode TEXT NOT NULL DEFAULT 'create',
  existing_brief_id UUID,
  current_step INTEGER NOT NULL DEFAULT 1,
  step_answers JSONB NOT NULL DEFAULT '{}',
  conversation_history JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'in_progress',
  brief_id UUID,
  build_notes_id UUID,
  starter_prompt_text TEXT,
  starter_prompt_copied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_planning_sessions_user ON planning_sessions(user_id);
CREATE INDEX idx_planning_sessions_event ON planning_sessions(event_id);
CREATE INDEX idx_planning_sessions_idea ON planning_sessions(idea_id);

-- ============================================
-- Project Briefs
-- AI-synthesized output from a completed planning session.
-- ============================================
CREATE TABLE project_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
  planning_session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  one_sentence_scope TEXT NOT NULL,
  target_user TEXT NOT NULL,
  core_feature TEXT NOT NULL,
  design_vibe TEXT,
  reference_url TEXT,
  color_tone_notes TEXT,
  out_of_scope TEXT NOT NULL,
  done_looks_like TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_briefs_user ON project_briefs(user_id);
CREATE INDEX idx_project_briefs_session ON project_briefs(planning_session_id);
CREATE INDEX idx_project_briefs_event ON project_briefs(event_id);

-- ============================================
-- Build Notes
-- AI-generated analysis document, created after the Project Brief.
-- ============================================
CREATE TABLE build_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_session_id UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
  project_brief_id UUID NOT NULL REFERENCES project_briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tensions JSONB,
  considerations JSONB,
  assumptions JSONB,
  v1_scope_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_build_notes_session ON build_notes(planning_session_id);
CREATE INDEX idx_build_notes_brief ON build_notes(project_brief_id);

-- ============================================
-- Deferred foreign keys on planning_sessions
-- These reference tables created above.
-- ============================================
ALTER TABLE planning_sessions
  ADD CONSTRAINT fk_planning_sessions_existing_brief
    FOREIGN KEY (existing_brief_id) REFERENCES project_briefs(id) ON DELETE SET NULL;

ALTER TABLE planning_sessions
  ADD CONSTRAINT fk_planning_sessions_brief
    FOREIGN KEY (brief_id) REFERENCES project_briefs(id) ON DELETE SET NULL;

ALTER TABLE planning_sessions
  ADD CONSTRAINT fk_planning_sessions_build_notes
    FOREIGN KEY (build_notes_id) REFERENCES build_notes(id) ON DELETE SET NULL;

-- ============================================
-- Row-Level Security
-- ============================================
ALTER TABLE planning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE build_notes ENABLE ROW LEVEL SECURITY;

-- Planning sessions: users can only access their own
CREATE POLICY "planning_sessions_select_own"
  ON planning_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "planning_sessions_insert_own"
  ON planning_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "planning_sessions_update_own"
  ON planning_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "planning_sessions_delete_own"
  ON planning_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Project briefs: owners have full access; event admins can read (not conversation history)
CREATE POLICY "project_briefs_select_own"
  ON project_briefs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "project_briefs_select_organizer"
  ON project_briefs FOR SELECT
  USING (event_id IS NOT NULL AND is_event_admin(event_id));

CREATE POLICY "project_briefs_insert_own"
  ON project_briefs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "project_briefs_update_own"
  ON project_briefs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "project_briefs_delete_own"
  ON project_briefs FOR DELETE
  USING (user_id = auth.uid());

-- Build notes: owners have full access; event admins can read
CREATE POLICY "build_notes_select_own"
  ON build_notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "build_notes_select_organizer"
  ON build_notes FOR SELECT
  USING (
    planning_session_id IN (
      SELECT id FROM planning_sessions
      WHERE event_id IS NOT NULL AND is_event_admin(event_id)
    )
  );

CREATE POLICY "build_notes_insert_own"
  ON build_notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "build_notes_delete_own"
  ON build_notes FOR DELETE
  USING (user_id = auth.uid());
