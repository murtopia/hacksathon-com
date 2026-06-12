# Hacksathon.com — Infra Notes

Operational notes for the things that aren't code: third-party config,
DNS, dashboard settings, secret material. The code repo is the source
of truth for the application; this doc is the source of truth for
everything that lives off-cluster.

---

## Transactional email (Resend + Supabase Auth SMTP)

We use Resend as the single outbound mail provider for both
application-sent email (invites, join-link confirmations, future
notifications) and Supabase Auth's confirmation/recovery emails. The
goal: every email a Hacksathon.com user receives ships from a
Hacksathon.com address, and we never get throttled by Supabase's
default auth-mail rate limit.

### How application emails work today

- `src/lib/email/resend.ts` is the Resend client singleton + `sendEmail`
  helper. Reads `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`
  from env.
- React Email components in `src/emails/` are the templates. Currently:
  - `participant-invite.tsx` — admin-sent email invitations.
  - `join-link-confirmation.tsx` — branded confirmation for join-link
    signups (replaces Supabase's default sign-up confirmation for that
    path).
  - `waitlist-confirmation.tsx` — marketing waitlist.
- The custom signup endpoint at
  `src/app/api/signup-via-join/route.ts` uses
  `admin.auth.admin.generateLink({ type: 'signup' })` to mint a
  confirmation URL without triggering Supabase's email, then ships
  that URL through `sendEmail`. This is how we keep the email-confirm
  gate AND own the email body.

### Supabase Auth SMTP — the catch-all fix

`/api/signup-via-join` only handles the join-link signup path. Every
other Supabase-issued email (password reset, magic link, generic
`/signup` without a join token, email-change confirmation) still goes
through Supabase's built-in sender by default. Wire Supabase to use
Resend via SMTP so those paths are branded and unthrottled too.

**One-time setup in the Supabase dashboard:**

1. **Project → Authentication → SMTP Settings** → toggle "Enable Custom
   SMTP".
2. Fill in Resend's SMTP credentials:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL/TLS) — or `587` if 465 is blocked at your
     network egress.
   - **Username:** `resend` (the literal string).
   - **Password:** the same `RESEND_API_KEY` we use in env. Treat as a
     secret.
   - **Sender email:** `noreply@hacksathon.com` (must be on a
     verified Resend domain — we already have `hacksathon.com`
     verified for invites).
   - **Sender name:** `Hacksathon.com`.
3. **Project → Authentication → Email Templates** → rewrite each
   template so they share the brand language used in our React Email
   components (`participant-invite.tsx` is the visual reference).
   Templates that matter:
   - **Confirm signup** — only fires for the generic `/signup` path
     now; join-link signups skip this.
   - **Magic Link** — currently unused on the app but worth branding
     pre-emptively if we ever wire it in.
   - **Change Email Address** — fires when a user changes their email
     in `/settings`.
   - **Reset Password** — fires from `/forgot-password`.
   - Liquid placeholders to know:
     `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .TokenHash }}`,
     `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .Data }}` (custom signup
     metadata).
4. **Project → Authentication → Rate Limits** → with custom SMTP
   active, raise the per-hour email cap. Resend's account-level limits
   are the real ceiling; Supabase's slider is just the cap it
   enforces locally before handing off to SMTP. Recommended values:
   - **"Rate limit for sending emails":** start at **500 / hour**.
     That's well clear of normal usage (an entire 40-person event's
     worth of invites in a single batch, plus headroom for password
     resets) and well under what Resend can handle.
   - Bump to **1,000–2,000 / hour** if/when we start running multiple
     concurrent events of 50+ people.
   - Don't go to 10,000+ unless we move to a paid Resend plan that
     justifies it — at that point we'd be re-evaluating the whole
     setup anyway.
   - Leave the OTP / token / sign-in rate limits at their defaults —
     they're not about email volume and Supabase tunes them for
     security, not throughput.

### Resend's real ceilings (for context)

So the "how high should I bump Supabase" question has a sane upper
bound to compare against:

- **Resend free tier:** 100 emails/day, 3,000/month, 2 req/sec.
- **Resend Pro ($20/mo):** 50,000 emails/month, 10 req/sec.
- **Resend per-domain:** no hard cap as long as we stay within plan
  and don't trip spam/abuse heuristics.

500/hour on Supabase = 12,000/day worst case, which would already
blow past Resend free. So if we ever hit the Supabase cap, the next
question is whether we're on the right Resend plan — not whether to
bump Supabase further.

### Verifying SMTP is live

After the SMTP swap, kick the tires:

- Trigger a password reset from `/forgot-password` and confirm the
  email comes from `noreply@hacksathon.com`, not `noreply@mail.app.supabase.io`.
- Inspect the headers (Gmail → "Show original") — `Received:` should
  show `smtp.resend.com`.
- Run a generic `/signup` with a throwaway email — same headers,
  branded body.

### Failure modes to watch

- **Resend rejects sender domain:** make sure `hacksathon.com` is on
  the Resend verified-domains list. Currently is, but worth checking
  if we ever rotate accounts.
- **Supabase auth-mail rate limit kicks back in:** symptom is `429 Email
  rate limit exceeded` even after SMTP is configured. Means Supabase's
  *own* per-hour cap is still active — bump it in the rate-limits
  panel (step 4 above).
- **`RESEND_API_KEY` rotation:** if we rotate, the secret needs to be
  updated in three places: Vercel env vars, Supabase SMTP password,
  and any local `.env.local` files.

### Receiving replies (inbound mail to invites@)

**Problem observed:** replying to one of our emails (e.g. to
`invites@hacksathon.com`) bounces with "Delivery incomplete." That's
expected — Resend is **send-only**. It authenticates us to *send* as
`hacksathon.com` (SPF/DKIM TXT records), but it does **not** host an
inbox, and our `From`/reply target `invites@hacksathon.com` has no
mailbox or inbound MX records to *receive* mail. So replies have
nowhere to land.

Our app code is fine and intentionally unchanged: `sendEmail` in
`src/lib/email/resend.ts` sends `From: Hacksathon.com
<invites@hacksathon.com>` and only sets a `Reply-To` if
`RESEND_REPLY_TO` is in env. The fix is purely an inbound-mail setup,
done one of two ways:

**Option A — Email forwarding (fastest, free/cheap).** Forward
`invites@hacksathon.com` to an existing Murtopolis inbox.
- *Cloudflare Email Routing* (if DNS is on Cloudflare): Email →
  Email Routing → add a custom address `invites@hacksathon.com` →
  destination = a verified Murtopolis address. Cloudflare adds the
  inbound `MX` + a verification `TXT` automatically.
- *ImprovMX* (registrar-agnostic): add the domain, create alias
  `invites@ → murtopolis inbox`, and add the two `MX` records +
  SPF `TXT` it gives you.
- **DNS caution:** adding inbound `MX` does **not** conflict with
  Resend's `SPF`/`DKIM` `TXT` records (different record types). If an
  SPF `TXT` already exists, *merge* the forwarder's `include:` into the
  one record rather than adding a second SPF line.

**Option B — Real mailbox (more control).** Stand up a dedicated
mailbox for the domain in Google Workspace / Fastmail / Zoho, create
`invites@hacksathon.com` (or `hello@`/`support@`), and point the
domain's `MX` at that provider. More setup + cost, but you get a true
inbox and can also *send* human replies from it.

**Recommended:** Option A forwarding `invites@hacksathon.com` →
a Murtopolis inbox now; revisit Option B if reply volume grows.

**Optional code follow-up (only if desired later):** set
`RESEND_REPLY_TO` in Vercel to a monitored address (e.g.
`hello@hacksathon.com`) so replies are explicitly steered there
regardless of the `From`. No code edit needed — `sendEmail` already
honors that env var.

**DMARC:** once SPF/DKIM are in place for sending, add a `_dmarc` `TXT`
record (`v=DMARC1; p=none; rua=mailto:<inbox>`) to start at monitoring
and improve deliverability; tighten `p=` later.

---

## Google Workspace mailbox vs. Resend (DNS coexistence)

We're standing up **Google Workspace** as a real mailbox for the domain
(this is "Option B" from the inbound-mail section above, and it finally
resolves the `invites@` reply-bounce problem). The setup runs through
GoDaddy, where the domain's DNS is hosted (nameservers
`ns39/ns40.domaincontrol.com`). The fear during setup is overwriting the
Resend or Vercel records. **They do not collide** — here's why, and what
to protect.

### The root-vs-subdomain split (why nothing breaks)

- **Resend** is scoped to the **`send` subdomain** (its `MX` and SPF live
  on `send.hacksathon.com`, which is also Resend's return-path / bounce
  domain) plus the root **`resend._domainkey`** DKIM record.
- **Google Workspace's** mailbox **`MX` goes on the root (`@`)** — a
  single record `smtp.google.com` (priority 1) in the current Google
  setup flow ("Name: Set to default value" = the root/blank host).
- Different hostnames means no conflict: a root `@` MX and a `send` MX are
  separate records and both resolve independently.

### Do-not-touch record list

These records are load-bearing. Leave them exactly as-is through the
Google setup (the GoDaddy DNS screenshots are the "before"/"after"
snapshots to compare against):

| Owner | Type | Name | Value |
|---|---|---|---|
| Google | `MX` | `@` | `smtp.google.com` (priority 1) — now live |
| Resend | `MX` | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
| Resend | `TXT` | `dc-fd741b8612._spfm.send` | `v=spf1 include:amazonses.com ~all` |
| Resend | `TXT` | `send` | `v=spf1 include:dc-fd741b8612._spfm.send.hacksathon.com ~all` (Resend SPF macro chain) |
| Resend | `TXT` | `resend._domainkey` | `p=MIGfMA0...` (DKIM key) |
| Vercel | `A` | `@` | `216.150.1.1` |
| Vercel | `CNAME` | `www` | `...vercel-dns-016.com` |

(The existing `google-site-verification` `TXT` on `@` and the
`_domainconnect` `CNAME` are also fine to keep.)

**DMARC note (GoDaddy auto-added):** the live zone now has a `_dmarc` `TXT`
GoDaddy created automatically:
`v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net`.
It does **not** block Google verification, and because alignment is
relaxed (`adkim=r`/`aspf=r`) both senders pass: Resend's DKIM signs
`d=hacksathon.com` via `resend._domainkey`, and Google signs with its own
selector. Two caveats worth revisiting (not urgent): `rua` points at
GoDaddy's `onsecureserver.net`, so **we never see the aggregate reports**,
and `p=quarantine` is aggressive for a brand-new setup. Recommended: once
Workspace is verified and Google DKIM is in, repoint `rua` to a monitored
inbox (e.g. `dmarc@` / `nick.murto@`) and consider dialing back to
`p=none` for an initial monitoring window before re-tightening — see the
DMARC follow-up below.

### The "delete pre-existing MX records" caveat

Google's wizard warns to *"delete any pre-existing MX records."* That
targets conflicting **root** MX records — of which we currently have
**none**. The only MX in the zone is the `send` one, which belongs to
Resend. **Do not delete the `send` MX.** Google's root MX is simply added
alongside it.

### SPF independence

Google may add a root SPF (`v=spf1 include:_spf.google.com ~all` on `@`).
That's independent from Resend's `dc-fd741b8612._spfm.send` SPF — they're
on different hosts. Resend uses `send.hacksathon.com` as its return-path,
so it doesn't depend on a root SPF at all. No merge is required between
the two.

### Recommended setup path

- **Prefer the manual MX add** over GoDaddy's "Domain Connect" / Google
  auto-login, for full control: in GoDaddy DNS, add just the one Google
  `MX` (`smtp.google.com`, priority 1, root) plus whatever verification
  record Google hands you, and touch nothing else.
- **If you use the auto-connect anyway:** after it finishes, immediately
  re-open the GoDaddy DNS list and confirm the do-not-touch records above
  are still present and unchanged. Re-add any that were removed.

### Verification troubleshooting (Gmail activation)

**Symptom seen:** Google's setup shows *"Unable to verify at the moment —
Verification could not be completed,"* nudging you to delete pre-existing
MX records and retry.

**Diagnosis:** the DNS is **already correct and globally propagated** —
this was confirmed by querying three resolvers (the default,
Google's `8.8.8.8`, and Cloudflare's `1.1.1.1`):

- Root `MX` returns exactly `1 smtp.google.com.` on all three (only the
  Google MX competes at the root — the `send` MX is a subdomain and is
  invisible to the root lookup).
- The `google-site-verification=WcH91USf-1xjS_pg1Xw...` ownership `TXT` is
  live.

So the failure is **not** a DNS problem on our side. "Unable to verify *at
the moment*" is a Google-side timing / transient issue: their activation
checker can lag public DNS by minutes to several hours (Google's own
worst case is 48h) and may cache the earlier "not found" result.

**What to do:**

- **Do NOT delete the `send` MX** — Google's "delete pre-existing MX
  records" line is generic boilerplate; the `send` MX is Resend's and is
  not the cause.
- Don't rapid-fire **Retry**. Wait ~30–60 min and retry once, or click
  **"Switch to manual verification"** — that path confirms ownership via
  the already-live `TXT` and lets you proceed; Gmail routing flips on once
  Google's MX check catches up.
- To re-check propagation yourself:
  `dig +short MX hacksathon.com @8.8.8.8` (should return only
  `1 smtp.google.com.`).

**Resolved (2026-06-04):** the "wait it out" theory was wrong — the
GoDaddy-guided wizard kept failing for ~20h on provably correct,
globally consistent DNS (root `MX` identical on `ns39`, `ns40`, and
`8.8.8.8`; single ownership TXT; no CAA/DNSSEC issues). The fix was to
**stop using the GoDaddy-guided flow and drive activation from the Google
Admin console directly**: [admin.google.com](https://admin.google.com) →
Account → Domains → Manage domains (already showed **Verified**) →
**Activate Gmail → "Set up MX record" → Next**. That native path completed
immediately. **Lesson for future domains:** skip the registrar-guided
wizard and activate from admin.google.com — the guided hand-off loops on
already-correct DNS.

### What this unblocks (see "Receiving replies" above)

Once the root `MX` points at Google, the `invites@` reply-bounce issue
documented in **Receiving replies (inbound mail to invites@)** is
resolved: create `invites@hacksathon.com` (and/or `hello@`/`support@`) as
a Workspace mailbox or alias so replies land. Optionally set
`RESEND_REPLY_TO` in Vercel to that monitored address so outbound mail
explicitly steers replies there (`sendEmail` already honors that env var —
no code change).

### Email addresses / aliases (provisioned 2026-06-04)

All of the following are now live as **alternate email addresses
(aliases) on the `nick.murto@hacksathon.com` user**, so mail to any of
them lands in that one inbox:

| Address | Role | Why |
|---|---|---|
| `nick.murto@hacksathon.com` | Primary mailbox | The real account. |
| `invites@hacksathon.com` | Alias (the important one) | The app's hard-coded `from` for *all* transactional mail (default in [src/lib/email/resend.ts](../hacksathon-app/src/lib/email/resend.ts): `Hacksathon.com <invites@hacksathon.com>`). This alias is what makes replies land instead of bounce. |
| `noreply@hacksathon.com` | Alias | The designated Supabase Auth SMTP sender (password resets, email-change, generic `/signup`). Not active until custom SMTP is wired, but aliased now so stray replies don't bounce. |
| `hello@hacksathon.com` | Alias | Friendly public-facing contact. |
| `support@hacksathon.com` | Alias | Public-facing support contact. |
| `privacy@hacksathon.com` | Alias | Privacy-policy / data-request contact. |

**Catch-all: intentionally skipped.** We went with explicit aliases
instead. Rationale: a catch-all (`@hacksathon.com` → primary) is a spam
magnet (spammers blast random local-parts) and masks typos/bounces. If we
ever want it as a safety net, add it via Apps → Google Workspace → Gmail →
**Default routing**, matching the domain with **"Perform this action only
on unrecognized addresses"**, and route it to a labeled/filtered folder
rather than straight to the main inbox.

Notes / non-issues:

- **`info@hacksathon.com` is NOT used by the app** anywhere (the earlier
  mention was a mix-up). Not created; nothing needs it.
- **`support@hacksathon.com`** is the app's "contact us" address (the
  pricing "Let's talk" link and the over-cap checkout message). Updated
  2026-06-09 from the old `nick@murtopolis.com` to this live alias so all
  contact points stay on the hacksathon.com domain.
- **`support@`/`hello@`/`privacy@` are personal aliases today.** If any
  one later needs shared/collaborative receipt (multiple people, shared
  inbox), convert just that address to a **Group** (Directory → Groups);
  no need now.
- **Aliases are inbound-only.** The app keeps *sending* through Resend
  (DKIM/SPF), so these Google aliases only affect where *replies* land —
  no conflict with outbound. To manually *reply as* `invites@` from Gmail,
  add it under Gmail → Settings → "Send mail as".
- **`RESEND_REPLY_TO` is currently unset**, so replies default to the
  `from` (`invites@`) — which now routes to `nick.murto@` automatically.
  Set the env var later only if you want to steer replies to a different
  address (e.g. `hello@`).

### Follow-ups (not blocking)

- **Google DKIM:** Workspace setup will later have you add a
  `google._domainkey` `TXT`. It coexists with Resend's `resend._domainkey`
  — both senders sign with their own selector.
- **DMARC:** a `_dmarc` `TXT` already exists (GoDaddy auto-added it — see
  the DMARC note in the do-not-touch section). It works, but repoint its
  `rua` to a monitored inbox we own (so we actually receive the aggregate
  reports) and consider starting at `p=none` for an initial monitoring
  window before re-tightening to `quarantine`/`reject`.

---

## Why this isn't a code change

Supabase Auth's email pathway is owned by the Supabase service, not
the application. There's no programmatic way (today) to set SMTP
credentials via the JS SDK or a migration — it lives behind the
dashboard's `auth.email.*` settings. So the application-side mitigation
is to bypass Supabase Auth's email entirely for the highest-volume
flow (join-link signup), and the dashboard config catches everything
else.

---

## Supabase email templates — copy-paste HTML

The four templates below match the design system in
`src/lib/email/email-styles.ts` (the shared source of truth for all
React Email templates): EB Garamond headings, Inter body, JetBrains
Mono brand bar, and the `#1A1A1A` / `#525252` / `#A3A3A3` / `#E8E8E8`
palette.

Inline styles carry the design (Outlook in particular drops `<style>`
blocks). Each template also prepends a small `<style>` `@font-face`
block as progressive enhancement, mirroring what
`src/lib/email/email-head.tsx` does for the app templates: clients that
honor it load the real webfonts, and the inline `font-family` fallbacks
(`Georgia` for headings, system sans for body) do the real work
everywhere else.

Supabase template placeholders:

- `{{ .ConfirmationURL }}` — full URL with token. Click handler that
  Supabase manages; lands on `/callback?code=...&type=...`.
- `{{ .SiteURL }}` — the configured Site URL (`https://hacksathon.com`).
- `{{ .Email }}` — the recipient address.
- `{{ .Token }}` / `{{ .TokenHash }}` — raw 6-digit OTP and its hash;
  only needed for one-time-code flows (we use links).

Each template needs:

1. A **Subject line** (set in the dashboard sidebar, above the body).
2. The **HTML body** below.

### Subject lines

| Template | Subject |
|---|---|
| Confirm signup | `Confirm your email — Hacksathon.com` |
| Reset Password | `Reset your Hacksathon.com password` |
| Magic Link | `Your Hacksathon.com sign-in link` |
| Change Email Address | `Confirm your new email — Hacksathon.com` |

### 1. Confirm signup

**Subject:** `Confirm your email — Hacksathon.com`

```html
<style>
  @font-face { font-family: 'EB Garamond'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf) format('truetype'); }
  @font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf) format('truetype'); }
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F5;margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;max-width:520px;padding:32px 28px;">
        <tr><td style="padding-bottom:16px;">
          <p style="color:#1A1A1A;font-family:'JetBrains Mono','SF Mono','Fira Code',monospace;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Hacksathon.com</p>
        </td></tr>
        <tr><td>
          <h1 style="color:#1A1A1A;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;margin:0 0 12px 0;">Confirm your email.</h1>
          <p style="color:#1A1A1A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.55;margin:0 0 12px 0;">Welcome to Hacksathon.com. Confirm your email below to finish setting up your account.</p>
        </td></tr>
        <tr><td style="padding:20px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color:#1A1A1A;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:600;padding:12px 22px;text-decoration:none;">Confirm email</a>
        </td></tr>
        <tr><td>
          <p style="color:#525252;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;margin:0 0 12px 0;word-break:break-all;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#1A1A1A;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0;"><hr style="border:none;border-top:1px solid #E8E8E8;margin:0;"/></td></tr>
        <tr><td>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0 0 6px 0;">This confirmation was sent to {{ .Email }}. If you didn't sign up, you can ignore this email.</p>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0;">Hacksathon.com</p>
        </td></tr>
      </table>
    </td>
  </tr>
</table>
```

### 2. Reset Password

**Subject:** `Reset your Hacksathon.com password`

```html
<style>
  @font-face { font-family: 'EB Garamond'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf) format('truetype'); }
  @font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf) format('truetype'); }
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F5;margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;max-width:520px;padding:32px 28px;">
        <tr><td style="padding-bottom:16px;">
          <p style="color:#1A1A1A;font-family:'JetBrains Mono','SF Mono','Fira Code',monospace;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Hacksathon.com</p>
        </td></tr>
        <tr><td>
          <h1 style="color:#1A1A1A;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;margin:0 0 12px 0;">Reset your password.</h1>
          <p style="color:#1A1A1A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.55;margin:0 0 12px 0;">Click the button below to set a new password for your Hacksathon.com account. The link is valid for one hour.</p>
        </td></tr>
        <tr><td style="padding:20px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color:#1A1A1A;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:600;padding:12px 22px;text-decoration:none;">Reset password</a>
        </td></tr>
        <tr><td>
          <p style="color:#525252;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;margin:0 0 12px 0;word-break:break-all;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#1A1A1A;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0;"><hr style="border:none;border-top:1px solid #E8E8E8;margin:0;"/></td></tr>
        <tr><td>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0 0 6px 0;">This reset link was sent to {{ .Email }}. If you didn't request a password reset, you can safely ignore this email - your password won't change.</p>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0;">Hacksathon.com</p>
        </td></tr>
      </table>
    </td>
  </tr>
</table>
```

### 3. Magic Link

**Subject:** `Your Hacksathon.com sign-in link`

```html
<style>
  @font-face { font-family: 'EB Garamond'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf) format('truetype'); }
  @font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf) format('truetype'); }
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F5;margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;max-width:520px;padding:32px 28px;">
        <tr><td style="padding-bottom:16px;">
          <p style="color:#1A1A1A;font-family:'JetBrains Mono','SF Mono','Fira Code',monospace;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Hacksathon.com</p>
        </td></tr>
        <tr><td>
          <h1 style="color:#1A1A1A;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;margin:0 0 12px 0;">Your sign-in link.</h1>
          <p style="color:#1A1A1A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.55;margin:0 0 12px 0;">Click the button below to sign in to Hacksathon.com. The link is single-use and expires shortly.</p>
        </td></tr>
        <tr><td style="padding:20px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color:#1A1A1A;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:600;padding:12px 22px;text-decoration:none;">Sign in</a>
        </td></tr>
        <tr><td>
          <p style="color:#525252;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;margin:0 0 12px 0;word-break:break-all;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#1A1A1A;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0;"><hr style="border:none;border-top:1px solid #E8E8E8;margin:0;"/></td></tr>
        <tr><td>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0 0 6px 0;">This sign-in link was sent to {{ .Email }}. If you didn't request it, you can ignore this email.</p>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0;">Hacksathon.com</p>
        </td></tr>
      </table>
    </td>
  </tr>
</table>
```

### 4. Change Email Address

**Subject:** `Confirm your new email — Hacksathon.com`

```html
<style>
  @font-face { font-family: 'EB Garamond'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/ebgaramond/v32/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf) format('truetype'); }
  @font-face { font-family: 'Inter'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf) format('truetype'); }
  @font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 600; font-display: swap; src: url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8FqtjPQ.ttf) format('truetype'); }
</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F5F5;margin:0;padding:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;max-width:520px;padding:32px 28px;">
        <tr><td style="padding-bottom:16px;">
          <p style="color:#1A1A1A;font-family:'JetBrains Mono','SF Mono','Fira Code',monospace;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Hacksathon.com</p>
        </td></tr>
        <tr><td>
          <h1 style="color:#1A1A1A;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;line-height:1.1;letter-spacing:-0.02em;margin:0 0 12px 0;">Confirm your new email.</h1>
          <p style="color:#1A1A1A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.55;margin:0 0 12px 0;">Confirm the new email address on your Hacksathon.com account by clicking the button below.</p>
        </td></tr>
        <tr><td style="padding:20px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color:#1A1A1A;border-radius:8px;color:#ffffff;display:inline-block;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:600;padding:12px 22px;text-decoration:none;">Confirm new email</a>
        </td></tr>
        <tr><td>
          <p style="color:#525252;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;margin:0 0 12px 0;word-break:break-all;">Or paste this link into your browser:<br/><a href="{{ .ConfirmationURL }}" style="color:#1A1A1A;text-decoration:underline;">{{ .ConfirmationURL }}</a></p>
        </td></tr>
        <tr><td style="padding:24px 0;"><hr style="border:none;border-top:1px solid #E8E8E8;margin:0;"/></td></tr>
        <tr><td>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0 0 6px 0;">If you didn't request this change, sign in and review your account settings - your password may have been compromised.</p>
          <p style="color:#A3A3A3;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.5;margin:0;">Hacksathon.com</p>
        </td></tr>
      </table>
    </td>
  </tr>
</table>
```

### Maintenance

The design tokens above (palette, fonts, button) come from
`src/lib/email/email-styles.ts`, the single source of truth for every
React Email template, and the `@font-face` block mirrors
`src/lib/email/email-head.tsx`. If those change, hand-port the changes
back into the four blocks above. There is no automated sync between the
React Email templates and the Supabase dashboard templates: they are
two separate stores.
