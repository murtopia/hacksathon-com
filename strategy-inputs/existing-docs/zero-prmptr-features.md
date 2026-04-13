# Features & Requirements

## Core Features (MVP)

### Conversational Doc Generation

**What it does:** Guides users through a friendly, one-question-at-a-time conversation to gather the information needed to generate each documentation file.

**User story:** As a vibe coder, I want to answer simple questions about my project so that I get professional docs without having to know how to write them myself.

**Acceptance criteria:**
- One question displayed at a time
- User can type freely or skip optional questions
- AI asks clarifying follow-ups when answers are vague or incomplete
- Progress indicator shows which doc they're working on
- Conversation feels casual and encouraging, not robotic
- Project type selection (Web App, Mobile App, CLI Tool, etc.) for contextual questions
- Multi-line input field that auto-expands as user types
- Enter to send, Shift+Enter for new lines

**Priority:** Must-have

---

### AI-Powered Document Generation

**What it does:** Synthesizes conversation answers into well-structured markdown documents optimized for AI coding assistants. Documents are AI-generated (not just answer dumps) and shown for user approval before saving.

**User story:** As a vibe coder, I want my answers transformed into clean, professional docs so that my AI coding tool understands my project.

**Acceptance criteria:**
- Generates 5 required docs: Project Brief, Features, User Flows, Design Guide, Tech Stack
- AI synthesizes answers into proper documents (not raw copy-paste)
- Documents use proper markdown formatting (headers, bullets, structure)
- **Section headers include emojis** for visual scanning (📋 🎯 ✨ 👥 🔧 etc.)
- **Callout blocks** for important notes (> 💡 **Pro tip:** ...)
- **Substantive content**: AI adds implementation suggestions, edge cases, industry patterns
- AI expands brief answers into fuller explanations
- Draft shown in chat for user review before finalizing
- User can approve ("Looks good!") or request changes
- Free tier uses Claude Sonnet 4
- Paid tiers use Claude Opus 4.5
- Documents optimized for AI coding assistant consumption

**Priority:** Must-have

---

### Document Preview & Review

**What it does:** Shows users the AI-generated document draft in the chat interface for approval before saving. Users can request changes or approve to finalize.

**User story:** As a user, I want to review each doc before it's saved so that I can make sure it captures my intent accurately.

**Acceptance criteria:**
- After all questions, AI generates a formatted draft in the chat
- Draft displayed in a styled box with clear "Draft Document" header
- "Looks good!" button to approve and save the document
- "Request changes" button to continue refining via chat
- Input field remains visible until user approves
- Can navigate back to previous docs via sidebar

**Priority:** Must-have

---

### Project Type Selection

**What it does:** Allows users to select a project type (Web App, Mobile App, CLI Tool, etc.) when creating a new project, which tailors the AI conversation and questions.

**User story:** As a user, I want to specify what type of project I'm building so that the AI asks relevant questions and provides appropriate suggestions.

**Acceptance criteria:**
- Dropdown in new project dialog with options: Web App, Mobile App, CLI Tool, API/Backend, Browser Extension, Desktop App, Other
- Selected type passed to AI context
- AI provides project-type-specific suggestions and examples
- Some questions conditionally shown/hidden based on type

**Priority:** Must-have

---

### Document Quality Scoring

**What it does:** Analyzes the completeness of user answers and displays a quality score in the sidebar to encourage thorough documentation.

**User story:** As a user, I want to see how complete my documentation is so that I know if I should add more detail.

**Acceptance criteria:**
- Quality score (0-100%) displayed in sidebar
- Score based on answer completeness, word count, and specificity
- Visual indicator (color-coded) for quick reference
- Encourages users to provide more detailed answers without being nagging

**Priority:** Must-have

---

### Sidebar Navigation

**What it does:** Shows progress through the documentation flow and allows users to jump back to previous sections. On mobile, navigation is accessible via a collapsible hamburger menu.

**User story:** As a user, I want to see where I am in the process and easily go back to edit previous sections, on any device.

**Acceptance criteria:**
- Shows all doc sections with status (completed, current, upcoming)
- Checkmarks for completed sections
- Click to navigate to any completed section
- Current section highlighted
- Optional sections clearly marked
- **Desktop**: Sidebar always visible with project sections
- **Mobile**: Fixed header with hamburger menu, slide-in sidebar overlay
- Unified navigation includes: Projects, current project sections, Showcase, Invite Friends, Settings
- Sidebar closes automatically after navigation on mobile

**Priority:** Must-have

---

### Pause & Resume

**What it does:** Automatically saves progress so users can leave and return to complete their project later. Full conversation history is persisted to the database.

**User story:** As a user, I want to pause and come back later so that I don't lose my work if I get interrupted.

**Acceptance criteria:**
- Auto-save after every answer
- **Chat messages persisted to database** - conversation survives page refresh
- Projects appear in dashboard as "In Progress"
- Resume button picks up exactly where they left off
- No explicit "save" action required
- Chat history cleared automatically when section is completed (keeps database lean)
- "Loading conversation..." indicator shown while fetching history

**Priority:** Must-have

---

### Project Dashboard

**What it does:** Shows all user's projects with their status and provides access to completed docs.

**User story:** As a user, I want to see all my projects in one place so that I can manage and access them easily.

**Acceptance criteria:**
- List of all projects (in progress and completed)
- Status indicator for each project
- "Continue" action for in-progress projects
- "View/Download" action for completed projects
- "Delete" action with confirmation
- Shows creation date and last modified

**Priority:** Must-have

---

### Document Export

**What it does:** Allows users to download their completed docs as a zip file.

**User story:** As a user, I want to download all my docs so that I can use them in my coding environment.

**Acceptance criteria:**
- "Download All" button generates zip file
- Zip contains all generated markdown files
- Files are named clearly (e.g., PROJECT_BRIEF.md, FEATURES.md)
- Download works on all major browsers

**Priority:** Must-have

---

### Enhanced Starter Prompt

**What it does:** Generates a comprehensive prompt users can paste into their AI coding tool (Cursor, Claude, etc.) to kick off development with all their docs as context.

**User story:** As a vibe coder, I want a ready-to-use prompt so that my AI coding assistant immediately understands my project and I can start building.

**Acceptance criteria:**
- Executive summary at top for quick AI context
- Inline summaries of each doc section
- First 3 actionable tasks to get started
- Full documentation references included (encourages doc maintenance)
- One-click copy button
- Included in zip download as `STARTER_PROMPT.md`
- Displayed prominently on completion screen

**Priority:** Must-have

---

### Authentication

**What it does:** Handles user accounts and login via Google OAuth.

**User story:** As a user, I want to log in easily so that my projects are saved to my account.

**Acceptance criteria:**
- Google OAuth as the login method
- Auto-pulls name from Google for personalization (uses first name in conversations)
- Session persistence (stay logged in)
- Logout functionality

**Priority:** Must-have

---

### Payments (Pack-Based)

**What it does:** Handles project credit purchases via pack-based pricing (no subscriptions).

**User story:** As a user, I want to buy project credits when I need them without recurring commitments.

**Acceptance criteria:**
- Free tier: 1 complete project, Claude Sonnet 4
- 3-Pack ($15): 3 projects, Claude Opus 4.5, never expires
- 5-Pack ($20): 5 projects, Claude Opus 4.5, never expires
- Stripe integration for one-time payments
- Clear upgrade prompts when credits reach 0
- Credits stack (multiple packs can be purchased)

**Priority:** Must-have

---

### Referral System

**What it does:** Allows users to invite friends via a unique referral link, rewarding both parties with bonus credits.

**User story:** As a user, I want to share the tool with friends and get rewarded when they sign up and purchase.

**Acceptance criteria:**
- Each user gets a unique 8-character referral code
- Shareable referral link (`/r/[CODE]`)
- Referral link shown in Settings page
- When referred user makes first purchase, both parties get +1 credit
- Referral code stored in cookie (7 days) for tracking
- No limit on number of referrals

**Priority:** Must-have

---

### Public Project Showcase

**What it does:** Optional public gallery where users can showcase their completed projects for inspiration and social proof.

**User story:** As a user, I want to optionally share my project publicly to inspire others and show off my work.

**Acceptance criteria:**
- Opt-in toggle on completion screen ("Make this project public")
- Public projects appear in /showcase gallery
- Gallery shows project cards with name, description, project type
- Individual project view shows read-only documentation
- Users can unlist projects at any time
- Featured projects (admin-curated) shown first

**Priority:** Must-have

---

### Feedback System

**What it does:** Collects user feedback after project completion to improve the product and gather testimonials.

**User story:** As a product owner, I want to collect feedback so that I can improve the tool and showcase happy users.

**Acceptance criteria:**
- Optional feedback form on completion screen
- Collects: build status, doc usefulness rating (1-5), most useful doc, improvement suggestions, testimonial
- Users can opt-in to have testimonial displayed publicly
- Admin dashboard shows all feedback
- Testimonials marked for potential marketing use

**Priority:** Must-have

---

## Future Features (Post-MVP)

- **Team plans** — Shared credits across seats
- **GitHub integration** — Push docs directly to repo
- **Template marketplace** — Community-contributed project templates
- **EDIT.Prmptr** — Companion product for markdown editing

---

## Non-Functional Requirements

### Performance
- Conversation responses feel instant (streaming)
- Doc generation completes within 10 seconds
- Page loads under 2 seconds

### Security
- Secure authentication via Supabase Auth
- Payment data handled entirely by Stripe (PCI compliant)
- User data isolated (users can only see their own projects)

### Accessibility
- Keyboard navigation throughout
- Screen reader compatible
- Sufficient color contrast

---

## Constraints

- Must work within Anthropic API rate limits
- Stripe required for payments (no alternatives initially)
- Web-only for MVP (no native mobile app)
- English only for initial launch

---

*Last updated: January 12, 2026*
