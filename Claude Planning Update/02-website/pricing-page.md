# Pricing Page

Status: Locked (pending final cohesion pass at end of project)
Version: 1.1.0
Last Updated: 2026-07-06 CDT
Last Updated By: Nick + Claude

Purpose:
The locked copy and structure for the public Pricing page.

Source of Truth:
Claude Planning Update (local)

Depends On:
- company-foundation.md
- 01-messaging/core-messaging-principles.md
- 02-website/the-program.md

Used By:
- Pricing page
- The Program Final CTA (See Pricing secondary link)
- How It Works CTA (See Pricing secondary link)
- Sales narrative

Lock Status:
Locked sections:
- Page Strategy
- Hero + Price Card
- Team Size Breakpoints
- Why One Flat Price
- Everything Included
- Common Questions
- Final CTA

All sections locked 2026-07-06. The page is complete pending the site-wide cohesion pass.

Working sections:
- Confirmed Pricing Facts (living factual reference)
- Live-Site Corrections Needed (until Nick applies them)

Next Review:
During the site-wide cohesion pass.

---

## Page Strategy

Decision 2026-07-06 (Nick approved): the live pricing page structure is strong and becomes the locked structure, with one new narrative section and one new FAQ added. The old plan of framing $995 against consultants, failed training, and team-building spend is retired: buyers already know those things are expensive, and defensive comparison copy makes a low price look insecure. A $995 price with Stripe checkout doesn't need defending; it needs explaining. Transparency is the persuasion, with one light value anchor (the per-person math and the pizza line).

Changes from the live page:
1. New section: Why One Flat Price (after the breakpoints table).
2. New FAQ: How much time does this take?
3. Correction: IdeaLab checklist item drops "sparks, and comments" (feature does not exist in the shipped IdeaLab).
4. Correction: "Team chat integration" reworded; it is a place to keep the team's chat URL, not a platform integration.

## Locked Page Copy

### 1. Hero + Price Card

## Simple Flat Rate Pricing

Just one price for your entire team and no recurring or subscription fees to worry about.

**$995** for up to 25 people

$30 per additional participant, up to 50.

**Buy Your Hacks-a-Thon**
Purchase now, then set everything up with the Hacky Helper.

**After purchase:** Buy your event → Meet the Hacky Helper → Invite your team → Schedule the blocks → Run it and showcase.

Running this for more than 50 people? **Let's talk.** Larger events and multi-team rollouts welcome.

### 2. Team Size Breakpoints

| Participants | Price | Per person |
| --- | --- | --- |
| Up to 25 | $995 | ~$39.80 |
| 30 | $1,145 | ~$38.17 |
| 40 | $1,445 | ~$36.13 |
| 50 | $1,745 | ~$34.90 |

### 3. Why One Flat Price

Because the alternative is worse. Per-seat pricing punishes you for inviting the whole team, and the whole team is the point. Subscriptions charge you long after the event ends. One flat price means one decision, one line on the expense report, and no math about who's "worth" including. Invite the front desk. Invite the founders. It costs the same.

For up to 25 people, that works out to about $40 a person for the full multi-week program: the guided blocks, the platform, the awards, all of it. Most teams spend more than that on the pizza.

### 4. Everything Included. Every Event.

No feature gates between sizes. A team of 10 gets the exact same platform as a team of 50.

#### For your team

- Full 10-block event format
- IdeaLab - idea submission and shared gallery
- Guided Blueprint - AI planning conversation that produces a build-ready plan
- Auto-generated Starter Prompt tuned to your build tool
- Bring your own AI build tool - Lovable, Cursor, v0, Replit, and more
- Shark Tank Pitch session structure
- Time-blocked build sessions with Blueprint + Starter Prompt handoff
- Hacky Awards voting and ceremony
- Reflections survey with guided prompts

#### For the admin

- Hacky Helper - guided, step-by-step event setup
- Hacksathon admin with block controls and participant management
- Team chat link - one place for your Slack, Discord, or Teams URL
- Branded email invites and notifications
- Auto-generated awards ceremony slideshow
- AI-generated reflection recap
- Your own vanity URL (hacksathon.com/yourteam)
- Public showcase page - recap, projects, winners, and reflections
- Custom branding with your company logo

### 5. Common Questions

#### What's included in every event?

Everything. Every event gets the complete platform - all 10 blocks, the Hacky Helper setup guide, the AI Blueprint and Starter Prompt, Hacky Awards, reflections with an AI recap, and your branding. The only variable is how many people you invite.

#### How much time does this take?

Ten short blocks, 15 to 60 minutes each. Most teams spread them across a couple of weeks; some compress into one. You set the schedule, and the program fits around real work. [See the full program →]

#### How does buying work?

You purchase your event up front, then set everything up - the Hacky Helper walks you through identity, schedule, your team, awards, and reflections step by step. Have a promo code? Enter it at checkout.

#### Is facilitation included?

The platform is the facilitator. The Hacky Helper walks you through setup step by step, every block carries participant-facing instructions and purpose, and the whole format is structured to run without outside help. You run it. That's the point.

#### Couldn't we just run our own hackathon?

You could. That's how this started, and it took months of design, a pile of custom tools, and a full pilot to get a version where everyone actually finishes. That's what you're buying: the guided blocks that remove every reason to stall, the Blueprint planning that keeps projects from collapsing, the Hacky Helper running the checklist, and the pitches, awards, and showcase that turn "I'll try" into "I shipped." A shared doc and a demo day can start a hackathon. This one finishes.

#### Is the AI build tool included?

No. Your price covers the Hacksathon platform. The AI build tools your team uses to actually build - Lovable, Cursor, v0, Replit, Google AI Studio, and others - are separate products, and many teams already have one through their company plan. You pick a default (or let participants choose their own) during setup.

### 6. Final CTA

## Ready to run your Hacks-a-Thon?

Buy your event, then set it up in minutes with the Hacky Helper.

**Primary:** Buy Your Hacks-a-Thon
**Secondary:** See the Seven2 Story

## Live-Site Corrections Needed

For Nick to apply in Cursor (the locked copy above already reflects them):

1. IdeaLab checklist item currently reads "idea submission, gallery, sparks, and comments." Sparks and comments do not exist in the shipped IdeaLab. Change to "idea submission and shared gallery."
2. "Team chat integration - Slack, Discord, or Teams" overstates the feature. It is a field where the admin keeps the team's chat URL. Change to "Team chat link - one place for your Slack, Discord, or Teams URL."
3. Add the Why One Flat Price section after the breakpoints table.
4. Add the "How much time does this take?" FAQ (second position), linking to The Program page.
5. Resolved: the header Case Study link (/seven2/final) and final CTA (/case-study) both redirect to /seven2 by design (a URL-restructure workaround, confirmed by Nick 2026-07-06). Optional tidy-up only: point both links directly at /seven2 someday so the redirects aren't load-bearing.
6. Add the "Couldn't we just run our own hackathon?" FAQ after the facilitation question (audit-accepted, 2026-07-06).
7. Add the After Purchase mini-flow under the price card: Buy your event → Meet the Hacky Helper → Invite your team → Schedule the blocks → Run it and showcase.
8. Extend the Let's Talk line: "Larger events and multi-team rollouts welcome."

## Confirmed Pricing Facts

Confirmed by Nick via product and site screenshots 2026-07-06, and the live page fetch of hacksathon.com/pricing. Factual source for all pricing copy. Not marketing copy.

- Model: simple flat-rate pricing. One price for the entire team. No recurring or subscription fees. No feature gates between team sizes.
- Price: $995 for up to 25 people.
- Overage: $30 per additional participant, up to 50 people. Breakpoints: 30 people $1,145; 40 people $1,445; 50 people $1,745.
- Beyond 50 people: "Let's talk" (mailto support@hacksathon.com).
- Primary pricing CTA: "Buy Your Hacks-a-Thon" linking to /checkout, with supporting line "Purchase now, then set everything up with the Hacky Helper."
- Buy flow: collects company/team name (names the workspace and event URL) and expected headcount, shows Total Today before payment, then Continue to Payment. Secure checkout by Stripe. Promo codes entered at checkout.
- Build tools (Lovable, Cursor, v0, Replit, Google AI Studio, and others) are separate and not included. Organizer picks a default or lets participants choose during setup.
- Facilitation is not a human service; the platform is the facilitator (self-serve by design).

## Change History

### v1.1.0
- Audit-accepted additions (Nick approved 2026-07-06): the "Couldn't we just run our own hackathon?" FAQ, the After Purchase mini-flow, and the extended Let's Talk line. Live-site correction list extended accordingly.
- Audit rulings logged: rejected the value-comparison-vs-workshops suggestion (comparison framing was deliberately retired) and the soft-guarantee idea (never invent promises).

### v1.0.0
- Locked the full page: live structure adopted, Why One Flat Price added, time-commitment FAQ added, sparks/comments and chat-integration corrections applied.
- Retired the consultant/training comparison framing; strategy documented.
- Recorded live-site corrections for Nick and updated Confirmed Pricing Facts from the live page fetch.

### v0.2.0
- Added metadata header and Confirmed Pricing Facts from product and site screenshots.

### v0.1.0
- Initial goal and notes.
