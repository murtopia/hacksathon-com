# Hacksathon.com — Pricing Strategy
*Strategy document for internal use and developer reference*
*Reconciled from Sessions 3 & 5 — Updated April 2026*

---

## Guiding Principle

The goal of Hacksathon.com's pricing is to be an easy, immediate "yes" for a creative agency head or L&D lead. The price should feel like a team software subscription — something approved without a procurement process — not a consulting engagement or an enterprise software contract.

**Flat-rate pricing by participant count** achieves this better than per-seat math. Buyers don't want to calculate. They want to know: "I have ~30 people. What does this cost?" One number. Done.

---

## The Pricing Structure

### Base rate: $995 for up to 25 participants

Every event starts at $995. This is the flat base — a number a manager can approve without a budget review at most agencies, and under $40 per person at the full 25-seat count.

### Additional participants: $30/seat over 25 (capped at 50)

For teams larger than 25, each additional participant adds $30 to the base. The self-serve maximum is 50 participants.

| Participants | Price | Per-Person Equivalent |
|---|---|---|
| Up to 25 | **$995** | ~$39.80 |
| 30 | **$1,145** | ~$38.17 |
| 40 | **$1,445** | ~$36.13 |
| 50 | **$1,745** | ~$34.90 |

The per-person cost decreases naturally as team size grows — no separate tiers to explain, no per-seat math anxiety at checkout.

### 51+ participants: Contact us

For larger orgs, multi-team events, or organizations wanting to run multiple events per year, pricing is custom. Framing: *"Contact us for multi-team or large-org events"* — this signals the product scales without implying a published price is being withheld.

These conversations typically lead to a large single-event rate, an annual license covering unlimited events within a participant ceiling, or a multi-department rollout plan.

### Why this structure works

- **One number to remember:** $995. Everything else is additive and obvious.
- **No tiers to explain:** Buyers answer one question — how many participants? — and the price calculates itself.
- **Self-serve ceiling of $1,745** means every transaction under 50 people requires no conversation, no sales call, no procurement event.
- **All packages include the complete platform** — no feature gates between sizes.

### What's included in every tier

- Full 10-block event format
- Organizer Dashboard (event setup, block controls, participant management)
- IdeaLab (idea submission, AI-assisted PRD generation, competitive analysis)
- ZERO.Prmptr (planning documentation module)
- Shark Tank Pitch module
- Build Blocks (time-blocked session structure)
- Reflection module (7-question post-event survey)
- Hacky Awards ceremony (auto-generated from voting data)
- Event Summary Report
- Resource Library (Design Direction Guide, Scope Guardian worksheet, Starter Prompt templates)
- Organizer coaching tips at every block

### Large-Org & Multi-Event

For organizations with 51+ participants or those wanting to run multiple events per year, pricing is custom. The conversation typically leads to one of:
- A large single-event rate (negotiated based on headcount)
- An annual license covering unlimited events within a defined participant ceiling
- A multi-department rollout plan with a single organizational admin account

---

## What Replaces the Free Trial

**There is no free trial.** A trial for an event product doesn't make sense — you can't meaningfully experience a hackathon with dummy data and no real participants.

Instead, the **Organizer Demo Environment** does the job better:

**Organizer Demo Environment (free, no time limit, no credit card)**

Any prospective buyer can:
- Create a free account
- Configure a complete event (all 10 blocks, custom branding, award categories)
- Preview every participant-facing screen exactly as participants will see it
- Read all Organizer coaching tips
- See sample outputs from a completed event (pre-populated with Seven2 data)

The Demo Environment **cannot** invite participants and **cannot** generate a live event URL. When the Organizer clicks "Launch Event & Invite Participants," they enter payment. That is the conversion moment — after they've invested time configuring an event they want to run.

**Why this converts better than a free trial:**
- The buyer knows exactly what they're purchasing
- Sunk cost works in our favor (they've built the event; starting over elsewhere means losing that work)
- No awkward "trial expired" moments
- Reduces refund risk significantly
- Creates a natural CRM signal: "User configured event, hasn't purchased" → follow-up opportunity

---

## The Book Layer — *Vibe Coding for Creatives* *(Future)*

The companion book is not yet finished and is not part of the current launch plan. When complete, it will be a self-published downloadable book — a companion piece to the platform rather than a standalone product tier.

Pricing, bundling, and any discount code integration will be revisited when the book is closer to completion. Companion pieces (Idea Worksheet, Prompt Template, Vibe QA Checklist, Build Tracker, Demo Framework) may be made available as free, ungated resources at hacksathon.com/resources ahead of the book launch.

---

## AI Usage Costs — Internal Notes

AI features (ZERO.Prmptr Planning Block, IdeaLab idea generation, PRD drafting) use Claude API. Estimated cost per participant across a full event: **under $0.20.** At these margins, there is no reason to meter AI usage or surface caps to participants. All tiers include unlimited AI feature usage. This may be revisited if enterprise customers run events with 500+ participants regularly, but that threshold is far from current operations.

---

## Affiliate & Discount Code Structure

### Build tool affiliates (future)
Hacksathon.com will pursue affiliate relationships with vibe coding platforms as they become available. Lovable is the priority — their affiliate program may or may not be live at the time of Hacksathon's launch. Bolt and other platforms (Cursor, Replit) are also worth investigating. This section will be updated as affiliate terms are confirmed.

### Sales rep & influencer discount codes
The platform needs a discount/promo code system that allows Nick to issue unique codes to individual salespeople or influencers. Each code should:
- Apply a defined dollar or percentage discount at checkout
- Be attributable to a specific person for commission tracking
- Have optional expiration dates and usage limits
- Report conversions in the Organizer/Admin dashboard

This is a standard feature requirement for the billing layer — should be scoped into the Stripe integration from the start.

---

## Pricing Page Copy Principles

1. **Lead with the base price**: *"$995 for up to 25 people, $30 per additional seat."* Simple, no math required.
2. **No feature gates in marketing copy**: Every event gets everything. The only variable is headcount.
3. **The Demo Environment CTA is the primary conversion path**: "Configure your event free. Pay when you're ready to launch."
4. **The Seven2 case study is the proof point** on every pricing-adjacent page.

---

*End of Pricing Strategy document*
*Cross-reference: Session 3 (Feature Prioritization), Session 5 (Pricing & Packaging), Session 6 (Go-to-Market)*
