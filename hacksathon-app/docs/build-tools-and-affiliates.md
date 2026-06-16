# Build Tools & Affiliates

This is the working reference for the build-tool lineup and our affiliate /
referral posture. The **code source of truth** is
[`src/lib/build-tool/labels.ts`](../src/lib/build-tool/labels.ts) - this doc
explains the *why* and tracks each program's status. Keep them in sync.

## Strategy: Lovable-first

We standardize the recommendation on **Lovable** (best-in-class for
non-technical teams, fastest path from idea to a live app) and present it as
the recommended default in the admin build-tool picker. Organizers can still:

- **Bring their own** - pick another recognized tool, let participants choose
  (`byo`), or type a custom tool name ("Other").
- **Explore other tools** - a collapsed, links-only section for discovery.
  These links carry our affiliate code where a program exists.

The participant starter prompt is **tailored only for Lovable** and stays
generic for every other tool (the only tool-specific copy is the Lovable
"click the paperclip" upload instruction in
[`starter-prompt.tsx`](../src/components/planning/starter-prompt.tsx)).

## How the registry works

Each tool in `RECOGNIZED_TOOL_META` carries:

| Field | Meaning |
| --- | --- |
| `label` | Display name |
| `url` | Homepage / learn-more |
| `affiliateUrl` | Outbound link surfaced in the picker (today = homepage for all) |
| `affiliate` | `true` only when `affiliateUrl` is a real enrolled link (adds `rel="sponsored"`) |
| `category` | `recommended` / `builder` / `owned` / `dev` |
| `blurb` | One-line description |
| `selectable` | `true` = choosable event tool + shows the showcase "Built with X" chip; `false` = explore-only outbound link |

- **Selectable** tools appear in the picker and the public showcase chip:
  Lovable (default), Bolt, v0, Replit, Google AI Studio.
- **Explore-only** tools are links for discovery, never stored as the event
  tool: Cursor, Windsurf, Base44, Emergent, Claude Code, ChatGPT / Codex.
  (Cursor stays "recognized" so any pre-existing event already set to it still
  renders correctly.)

## Affiliate / referral status (as of June 2026)

| Tool | Program | Status / notes | Enrollment |
| --- | --- | --- | --- |
| **Lovable** | Affiliate | **Applied - pending.** Their page advertises up to $100 per first-time subscriber; directories list ~20% recurring for 12 months, 60-day cookie, manual approval. Per-account link issued **after** approval. | `lovable.dev/partners/affiliates` |
| **Replit** | Referral (credits) | $10 in credits for you + the friend when they upgrade to Core. This is credits, not a sponsored cash link, so we treat it as learn-more (`affiliate: false`). Enterprise resellers: `replit.com/partners`. | `replit.com/refer` |
| **Cursor** | Referral (limited) | $25 usage credit per referral; referee gets 50% off first month. Limited-release, eligibility-gated (active paid sub, clean history, regular use). No public affiliate program. | `cursor.com/dashboard/referrals` |
| **Bolt.new** | None | StackBlitz docs explicitly state no affiliate/sponsorship program. | - |
| **v0 by Vercel** | None | No public affiliate program. | - |
| **Google AI Studio** | None | Free Google product. | - |
| **Base44** | Unverified | Wix-owned; Wix runs an affiliate program but a Base44-specific program is unconfirmed. Verify before enabling. | TBD |
| **Emergent** | Unverified | No confirmed program. Verify before enabling. | - |
| **Claude Code** | None | Included with Claude plans (owned). | - |
| **ChatGPT / Codex** | None | Included with ChatGPT plans (owned). | - |

**Bottom line:** no tool has `affiliate: true` today. Only Lovable has a real
program we've applied to; the rest either have no program or only credit-based
referrals that don't fit a sponsored outbound link.

## Wiring in the Lovable link (once approved)

When the Lovable affiliate application is approved and you have your personal
referral link, edit the `lovable` entry in
[`labels.ts`](../src/lib/build-tool/labels.ts):

```ts
lovable: {
  label: "Lovable",
  url: "https://lovable.dev",
  affiliateUrl: "https://lovable.dev/?via=YOUR_CODE", // <- real referral link
  affiliate: true,                                     // <- flip to true
  category: "recommended",
  blurb: "Best for non-technical teams. Fastest path from idea to a live app.",
  selectable: true,
  logo: "/build-tools/lovable.png", // official brand heart (approved asset)
},
```

Setting `affiliate: true` automatically adds `rel="noopener noreferrer
sponsored"` to every outbound Lovable link (hero card "Learn more" + explore
rows). No other changes are needed. Repeat the same pattern for any other tool
whose program we enroll in.

## Logos

Brand tiles live in [`public/build-tools/`](../public/build-tools/) as 48x48
rounded SVG tiles (brand color background + white/gradient glyph). New tools
(Windsurf, Base44, Emergent, Claude Code, ChatGPT) follow the same house style.

**Lovable** is the exception: it uses the official approved brand asset
(`lovable.png`, the gradient heart on a transparent background) rather than a
house-style tile. Source assets are in the Lovable brand folder under
`Claude Planning Docs/`.

## Out of scope (future)

- Marketing-page Lovable callout (pricing / homepage) - deferred.
- Real affiliate links for any tool beyond Lovable.
