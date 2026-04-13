# Data Gathering Guide — What's Done and What You Need to Do

## Already Collected (Automated)

The following data has been exported and saved to `strategy-inputs/`:

### existing-docs/
- [x] `PLANNING.md` — 670-line comprehensive project reference from hacksathon-site
- [x] `README.md` — Technical architecture doc from hacksathon-site
- [x] `playbook.pdf` — ChatGPT-generated Seven2 Hacks-a-Thon Playbook (3 pages)
- [x] `zero-prmptr-features.md` — Full ZERO.Prmptr product spec (316 lines)
- [x] `idealab-overview.md` — Comprehensive IdeaLab summary with AI features and schema
- [x] `edit-prmptr-overview.md` — Comprehensive EDIT.Prmptr summary with features and schema

### supabase-exports/
- [x] `reflections.csv` — 84 reflection responses from 12 participants across 7 questions
- [x] `votes.csv` — 90 individual votes from 15 voters across 6 categories
- [x] `awards.csv` — 6 award winners (Drift dominated with 3 wins)
- [x] `idealab-ideas.csv` — 32 project ideas submitted to IdeaLab for Seven2 org
- [x] `blocks.csv` — 8 event blocks (Kickoff through Showcase Showdown)
- [x] `excluded-projects.csv` — 14 projects excluded from voting ballot

---

## Still Needed (Manual Export Required)

### 1. Slack Channel Export — `slack-export/`

Export the `#hacks-a-thon` channel from Seven2's Slack workspace.

**Option A: Workspace Export (Admin required)**
1. Go to https://[your-workspace].slack.com/services/export
2. Select date range covering the hackathon period (Feb-Apr 2026)
3. Download the export zip
4. Extract and place the `#hacks-a-thon` channel folder here

**Option B: Channel Copy/Paste**
If you don't have export access, you can:
1. Open #hacks-a-thon in Slack
2. Scroll to the beginning of the channel
3. Select all messages (or key threads)
4. Copy/paste into a text file: `slack-export/hacks-a-thon-channel.txt`

**What to capture:**
- Progress updates and screenshots shared
- Breakthrough moments / "look what I got working" posts
- Questions asked (reveals pain points)
- Office hours requests
- Any links or resources shared
- General sentiment and energy level throughout the event

### 2. Google Meet Transcripts — `meeting-transcripts/`

For each recorded meeting that referenced the hackathon:

1. Go to Google Drive
2. Look in "Meet Recordings" folder or search for the meeting titles
3. Each recording should have a companion transcript (`.vtt`, `.sbv`, or Google Doc)
4. Download transcripts as text files

**Key meetings to find:**
- Kickoff session (Block Zero)
- Shark Tank pitches (Block 2)
- Any office hours sessions that were recorded
- Showcase Showdown Part 1
- Showcase Showdown Part 2
- Any post-event retrospective/debrief

**If no auto-transcription exists:**
Consider uploading the video files to an AI transcription service (Whisper, Otter.ai, etc.) to generate transcripts.

### 3. Google Planning Docs — `google-docs/`

Search Google Drive for any planning documents used to organize the hackathon:
- Event timeline / scheduling docs
- Communication templates (Slack announcements, email templates)
- Participant roster
- Budget or resource allocation docs
- Any brainstorming or strategy documents
- Calendar block planning docs

Download as PDF or .docx and place in this folder.

---

## Quick Stats from Exported Data

**Participation:**
- 12 people submitted reflections
- 15 people voted in the Hacky Awards
- 32 total ideas submitted to IdeaLab
- 13 projects completed (had live URLs)
- 2 projects still in progress

**Award Winners:**
- Best in Show: Drift (Callen Fulbright)
- Shut Up and Take My Money: Drift (Callen Fulbright)
- Best Execution: Drift (Callen Fulbright)
- Most Creative Idea: Cut-up lyric idea generator (Carlos Lantz)
- Best Shark Tank Pitch: Chris-Tron® IT Agent (Joe Moore)
- Most Seven2 Energy: Cut-up lyric idea generator (Carlos Lantz)

**Top Themes from Reflections:**
- Nearly universal surprise at how easy/accessible it was
- "Just start" was the most common advice
- Documentation and planning before prompting was a key learning
- Personal/passion projects drove more engagement than work projects
- Design direction to AI was harder than expected
- Most participants want to continue building
