-- ============================================
-- Hacksathon.com Core Schema
-- Multi-tenant SaaS for running company hackathons
-- ============================================

-- Enums
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
CREATE TYPE member_role AS ENUM ('admin', 'participant');
CREATE TYPE member_status AS ENUM ('invited', 'active', 'removed');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'voting', 'showcase', 'archived');
CREATE TYPE block_status AS ENUM ('upcoming', 'active', 'completed');
CREATE TYPE idea_status AS ENUM ('idea_stage', 'in_progress', 'completed');
CREATE TYPE doc_type AS ENUM ('project_brief', 'features', 'user_flows', 'design_guide', 'tech_stack', 'custom');

-- ============================================
-- Organizations
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1A1A1A',
  domain TEXT,
  stripe_customer_id TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_status subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Profiles (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Organization Members
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'participant',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  status member_status NOT NULL DEFAULT 'invited',
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================
-- Events (Hackathon Instances)
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  build_platform TEXT DEFAULT 'any',
  status event_status NOT NULL DEFAULT 'draft',
  branding JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  public_showcase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_org ON events(organization_id);

-- ============================================
-- Timeline Blocks
-- ============================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  purpose TEXT,
  status block_status NOT NULL DEFAULT 'upcoming',
  scheduled_date TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  checklists JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocks_event ON blocks(event_id);

-- ============================================
-- Award Categories
-- ============================================
CREATE TABLE award_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_award_categories_event ON award_categories(event_id);

-- ============================================
-- Reflection Questions
-- ============================================
CREATE TABLE reflection_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reflection_questions_event ON reflection_questions(event_id);

-- ============================================
-- Ideas (IdeaLab)
-- ============================================
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pitch TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  problem TEXT,
  status idea_status NOT NULL DEFAULT 'idea_stage',
  project_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ideas_event ON ideas(event_id);
CREATE INDEX idx_ideas_user ON ideas(user_id);

-- ============================================
-- Idea Sparks (Likes)
-- ============================================
CREATE TABLE idea_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

-- ============================================
-- Idea Comments
-- ============================================
CREATE TABLE idea_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_idea_comments_idea ON idea_comments(idea_id);

-- ============================================
-- Documents (ZERO.Prmptr + EDIT.Prmptr)
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doc_type doc_type NOT NULL DEFAULT 'custom',
  content TEXT DEFAULT '',
  quality_score INTEGER,
  is_generated BOOLEAN NOT NULL DEFAULT false,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_idea ON documents(idea_id);
CREATE INDEX idx_documents_user ON documents(user_id);

-- ============================================
-- Document Conversations (AI Chat History)
-- ============================================
CREATE TABLE doc_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  current_section TEXT,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Voting
-- ============================================
CREATE TABLE voting_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  voting_open BOOLEAN NOT NULL DEFAULT false,
  voting_deadline TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, category_id)
);

CREATE INDEX idx_votes_event ON votes(event_id);

CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
  winner_idea_id UUID REFERENCES ideas(id),
  winner_name TEXT,
  project_title TEXT,
  project_url TEXT,
  announced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE excluded_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, idea_id)
);

-- ============================================
-- Reflections
-- ============================================
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES reflection_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, question_id)
);

CREATE INDEX idx_reflections_event ON reflections(event_id);

-- ============================================
-- Platform Admin
-- ============================================
CREATE TABLE platform_admins (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Event Templates
-- ============================================
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]',
  award_categories JSONB NOT NULL DEFAULT '[]',
  reflection_questions JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Default Template: Seven2 Playbook
-- ============================================
INSERT INTO event_templates (name, description, is_default, blocks, award_categories, reflection_questions)
VALUES (
  'The Hacks-a-Thon Playbook',
  'The proven structure from the Seven2 Hacks-a-Thon. 8 time-blocked phases from kickoff to showcase, 6 award categories, and 7 reflection questions.',
  true,
  '[
    {"block_key": "zero", "title": "Kickoff", "duration_minutes": 15, "description": "Introduce the build platform, explain vibe coding, set expectations, and outline the structure.", "purpose": "Remove intimidation and create clarity before ideas begin."},
    {"block_key": "1", "title": "Sprint to the IdeaLab", "duration_minutes": 30, "description": "Brainstorm, define, and submit your project idea.", "purpose": "Commit to a direction and articulate why the idea matters."},
    {"block_key": "2", "title": "Shark Tank, Minus the Sharks", "duration_minutes": 45, "description": "Each participant delivers a 1-minute pitch with light team feedback.", "purpose": "Sharpen ideas and build collective energy."},
    {"block_key": "3", "title": "Documentation Is Everything", "duration_minutes": 30, "description": "Develop specifics around your idea using AI documentation tools.", "purpose": "Translate the idea into a buildable direction."},
    {"block_key": "4a", "title": "Here We Go!", "subtitle": "Build Session 1", "duration_minutes": 45, "description": "Start building your project!", "purpose": "Jumpstart development."},
    {"block_key": "4b", "title": "Build Session 2", "duration_minutes": 45, "description": "Protected build time with optional office hours.", "purpose": "Iterate and improve."},
    {"block_key": "4c", "title": "Your Final Build Session", "duration_minutes": 45, "description": "Last time-blocked build session. Continue in free time if desired.", "purpose": "Polish demo flow and prepare for showcase."},
    {"block_key": "final", "title": "Showcase Showdown", "duration_minutes": 120, "description": "Each participant presents a 3-minute demo followed by 2-minute Q&A.", "purpose": "Celebrate learning, reflect on insights, and capture takeaways."}
  ]'::jsonb,
  '[
    {"key": "best-in-show", "name": "Best in Show", "description": "The overall standout"},
    {"key": "take-my-money", "name": "Shut Up and Take My Money", "description": "The one everyone actually wants to use"},
    {"key": "execution", "name": "Best Execution", "description": "Cleanest build quality and implementation"},
    {"key": "creative", "name": "Most Creative Idea", "description": "The idea that surprised everyone"},
    {"key": "shark-tank", "name": "Best Shark Tank Pitch", "description": "Best presentation and storytelling during demos"},
    {"key": "company-energy", "name": "Most Company Energy", "description": "Creative, bold, and fun — pure company spirit"}
  ]'::jsonb,
  '[
    {"question_text": "What surprised you the most about the experience?"},
    {"question_text": "What do you wish you''d known before your very first prompt?"},
    {"question_text": "What did you discover about your own creative process along the way?"},
    {"question_text": "Did this unlock any ideas you''re actually going to pursue?"},
    {"question_text": "Did this change how you think about AI, vibe coding, or what''s possible for you creatively?"},
    {"question_text": "What advice would you give to a colleague who''s nervous to start?"},
    {"question_text": "What one thing — a tool, a resource, a mindset shift — would help future participants jump in faster?"}
  ]'::jsonb
);
