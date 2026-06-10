/**
 * Hacky Helper - stop + step machinery.
 *
 * Pure functions, no DB or clock side-effects. The caller loads the
 * raw event + org + blocks + roster bits, hands them in, and gets back
 * the current phase and the per-step state. This is the single source
 * of truth used by both `<HackyHelper>` (rendering) and the dashboard
 * redirect (deciding whether to send an admin straight to `/admin`).
 *
 * Phases:
 *   - "setup"   → at least one required step pending. The Helper shows
 *                 the full stops list and the first pending required
 *                 step gets the "Do this next" treatment. New admins
 *                 land on `/admin` on first touch.
 *   - "polish"  → every required step is done. The Helper still shows
 *                 every stop, but only recommended steps remain.
 *   - "run-day" → event is in flight (a scheduled block window has
 *                 started but the last one hasn't ended) and voting
 *                 hasn't opened yet. Helper shows the live monitor
 *                 instead of the stops list.
 *   - "wrap-up" → voting is open or winners are revealed. Helper shows
 *                 the linear wrap-up checklist.
 *
 * Stops:
 *   The Helper steps are grouped into six "stops" that mirror the
 *   admin sub-nav (01 Identity → 06 Reflections). Each stop carries a
 *   number prefix, a title that matches the sub-nav label, and a mix
 *   of required + recommended steps. See `computeHelperStops`.
 */

export type HelperPhase = "setup" | "polish" | "run-day" | "wrap-up";

export type HelperStepState = "done" | "pending";

/**
 * Required gates the dashboard redirect; recommended and event-day
 * don't. The visual treatment differs (see `<HackyHelper>`):
 *   - required    → solid marker, eligible for "Do this next".
 *   - recommended → dashed marker, "Optional" tag.
 *   - event-day   → solid marker, "Event day" tag. These are the
 *                   day-of actions (open voting, reveal winners,
 *                   generate + approve the recap) that happen once the
 *                   event runs. They live inside their natural sections
 *                   but never gate setup completion.
 */
export type HelperStepKind = "required" | "recommended" | "event-day";

export interface HelperStep {
  id: string;
  label: string;
  /**
   * Optional one-line clarification rendered beneath the label in
   * serif italic. Keep it to a tight clause.
   */
  hint?: string;
  /** Deep link to the admin surface that lets the user finish this step. */
  href: string;
  state: HelperStepState;
  kind: HelperStepKind;
}

/**
 * A "stop" on the admin journey - one per sub-nav tab. The Helper
 * renders each stop as an expandable accordion with its steps inside.
 */
export interface HelperStop {
  /** Sub-nav tab id this stop maps to (used for anchors). */
  id: "identity" | "integrations" | "schedule" | "team" | "awards" | "reflections";
  /** Two-digit prefix matching the sub-nav, e.g. "01". */
  number: string;
  /** Display title - matches the sub-nav label. */
  title: string;
  /** One-line stop blurb, italic serif. Optional. */
  blurb?: string;
  steps: HelperStep[];
  /** Counts derived from `steps`. */
  total: number;
  done: number;
  requiredTotal: number;
  requiredDone: number;
}

export interface HelperBlock {
  id: string;
  scheduled_date: string | null;
  duration_minutes: number | null;
}

export interface HelperContext {
  event: {
    title: string;
    welcome_message: string | null;
    logo_url: string | null;
    vanity_slug: string | null;
    voting_status: "closed" | "open" | "revealed";
    voting_open_at: string | null;
    voting_close_at: string | null;
    results_published_at: string | null;
    reflection_status: "closed" | "open" | "complete";
    reflections_open_at: string | null;
    reflections_close_at: string | null;
    reflection_summary: string | null;
    reflection_summary_approved_at: string | null;
    settings: Record<string, unknown> | null;
    team_chat_url: string | null;
    build_tool: string;
  };
  org: { name: string };
  blocks: HelperBlock[];
  /** Active roster count, including the calling admin. */
  rosterCount: number;
  /** Has the admin sent at least one invite OR generated a join link? */
  hasTeamInvited: boolean;
  /** Number of distinct invitations sent (email invites only - for the count display). */
  invitedCount: number;
}

// ─────────────────────────────────────────────────────────────────────
// Step predicates
// ─────────────────────────────────────────────────────────────────────

function orgNameDone(ctx: HelperContext): boolean {
  return ctx.org.name.trim().length > 0;
}

function eventTitleDone(ctx: HelperContext): boolean {
  const t = ctx.event.title.trim().toLowerCase();
  return t.length > 0 && t !== "untitled" && t !== "untitled event";
}

function welcomeMessageDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.welcome_message?.trim());
}

function anyBlockScheduledDone(ctx: HelperContext): boolean {
  return ctx.blocks.some((b) => Boolean(b.scheduled_date));
}

function teamInvitedDone(ctx: HelperContext): boolean {
  return ctx.hasTeamInvited || ctx.rosterCount > 1;
}

function logoDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.logo_url);
}

function vanityConfirmedDone(ctx: HelperContext): boolean {
  return Boolean(stamped(ctx, "vanity_confirmed_at"));
}

function teamChatDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.team_chat_url?.trim());
}

function buildToolConfirmedDone(ctx: HelperContext): boolean {
  return Boolean(stamped(ctx, "build_tool_confirmed_at"));
}

function allBlocksScheduledDone(ctx: HelperContext): boolean {
  return (
    ctx.blocks.length > 0 && ctx.blocks.every((b) => Boolean(b.scheduled_date))
  );
}

function showcaseDecisionDone(ctx: HelperContext): boolean {
  return Boolean(stamped(ctx, "showcase_decision_at"));
}

function awardsReviewedDone(ctx: HelperContext): boolean {
  return Boolean(stamped(ctx, "awards_reviewed_at"));
}

function reflectionsReviewedDone(ctx: HelperContext): boolean {
  return Boolean(stamped(ctx, "reflections_reviewed_at"));
}

function votingWindowDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.voting_open_at && ctx.event.voting_close_at);
}

function reflectionWindowDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.reflections_open_at && ctx.event.reflections_close_at);
}

function votingOpenedDone(ctx: HelperContext): boolean {
  return (
    ctx.event.voting_status === "open" ||
    ctx.event.voting_status === "revealed"
  );
}

function winnersRevealedDone(ctx: HelperContext): boolean {
  return ctx.event.voting_status === "revealed";
}

function resultsPublishedDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.results_published_at);
}

function reflectionsOpenedDone(ctx: HelperContext): boolean {
  return (
    ctx.event.reflection_status === "open" ||
    ctx.event.reflection_status === "complete"
  );
}

function reflectionsCompleteDone(ctx: HelperContext): boolean {
  return ctx.event.reflection_status === "complete";
}

function recapGeneratedDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.reflection_summary?.trim());
}

function recapApprovedDone(ctx: HelperContext): boolean {
  return Boolean(ctx.event.reflection_summary_approved_at);
}

function stamped(ctx: HelperContext, key: string): string | undefined {
  const v = ctx.event.settings?.[key];
  return typeof v === "string" ? v : undefined;
}

// ─────────────────────────────────────────────────────────────────────
// Stop builders
// ─────────────────────────────────────────────────────────────────────

function step(
  partial: Omit<HelperStep, "state"> & { done: boolean },
): HelperStep {
  const { done, ...rest } = partial;
  return { ...rest, state: done ? "done" : "pending" };
}

function buildStop(
  id: HelperStop["id"],
  number: string,
  title: string,
  blurb: string | undefined,
  steps: HelperStep[],
): HelperStop {
  const requiredSteps = steps.filter((s) => s.kind === "required");
  return {
    id,
    number,
    title,
    blurb,
    steps,
    total: steps.length,
    done: steps.filter((s) => s.state === "done").length,
    requiredTotal: requiredSteps.length,
    requiredDone: requiredSteps.filter((s) => s.state === "done").length,
  };
}

function identityStop(ctx: HelperContext, slug: string): HelperStop {
  const base = `/${slug}/admin`;
  return buildStop(
    "identity",
    "01",
    "Identity",
    "What your event is called, who's running it, and where it lives.",
    [
      step({
        id: "company-name",
        kind: "required",
        label: "Add your company name",
        hint: "Participants see it in invitations and the showcase header.",
        href: `${base}/identity#org-basics`,
        done: orgNameDone(ctx),
      }),
      step({
        id: "event-title",
        kind: "required",
        label: "Name your event",
        hint: "Used on every participant screen and email.",
        href: `${base}/identity#basics`,
        done: eventTitleDone(ctx),
      }),
      step({
        id: "welcome-message",
        kind: "required",
        label: "Write a welcome message",
        hint: "One or two lines on the participant home that set the tone.",
        href: `${base}/identity#welcome`,
        done: welcomeMessageDone(ctx),
      }),
      step({
        id: "logo",
        kind: "recommended",
        label: "Upload a logo",
        hint: "Appears on the event home, invitations, and the showcase.",
        href: `${base}/identity#logo`,
        done: logoDone(ctx),
      }),
      step({
        id: "vanity-url",
        kind: "recommended",
        label: "Confirm your vanity URL",
        hint: `Your event lives at hacksathon.com/${ctx.event.vanity_slug ?? "your-team"}.`,
        href: `${base}/identity#vanity`,
        done: vanityConfirmedDone(ctx),
      }),
    ],
  );
}

function integrationsStop(ctx: HelperContext, slug: string): HelperStop {
  const base = `/${slug}/admin`;
  return buildStop(
    "integrations",
    "02",
    "Integrations",
    "Where your team chats and what they build with.",
    [
      step({
        id: "team-chat",
        kind: "recommended",
        label: "Add a team chat link",
        hint: "Slack, Discord, or Teams - surfaces on the event home and inside build blocks.",
        href: `${base}/integrations#chat`,
        done: teamChatDone(ctx),
      }),
      step({
        id: "build-tool",
        kind: "recommended",
        label: "Confirm your build tool",
        hint: "Drives the starter prompt and the Blueprint handoff.",
        href: `${base}/integrations#build-tool`,
        done: buildToolConfirmedDone(ctx),
      }),
    ],
  );
}

function scheduleStop(ctx: HelperContext, slug: string): HelperStop {
  const base = `/${slug}/admin`;
  return buildStop(
    "schedule",
    "03",
    "Schedule",
    "When each block runs. Unscheduled blocks stay Upcoming forever.",
    [
      step({
        id: "schedule-blocks",
        kind: "required",
        label: "Schedule at least one block",
        hint: "Participant timelines won't advance until something on the schedule has a start time.",
        href: `${base}/schedule`,
        done: anyBlockScheduledDone(ctx),
      }),
      step({
        id: "schedule-all",
        kind: "recommended",
        label: "Schedule the remaining blocks",
        hint: "Knock these out so every participant block has a time.",
        href: `${base}/schedule`,
        done: allBlocksScheduledDone(ctx),
      }),
    ],
  );
}

function teamStop(ctx: HelperContext, slug: string): HelperStop {
  const base = `/${slug}/admin`;
  const invited = ctx.invitedCount;
  const inviteHint =
    invited > 0
      ? `${invited} invited so far · add more anytime.`
      : "Share the join link or email invites - add more as you go.";

  return buildStop(
    "team",
    "04",
    "Team",
    "Get participants on the roster.",
    [
      step({
        id: "invite-team",
        kind: "required",
        label: "Invite your team",
        hint: inviteHint,
        href: `${base}/team#participants`,
        done: teamInvitedDone(ctx),
      }),
    ],
  );
}

function awardsStop(ctx: HelperContext, slug: string): HelperStop {
  const base = `/${slug}/admin`;
  return buildStop(
    "awards",
    "05",
    "Hacky Awards",
    "Voting, public showcase, and the categories your team will vote in.",
    [
      step({
        id: "showcase-decision",
        kind: "recommended",
        label: "Decide on public showcase",
        hint: "Toggle whether anonymous visitors see your event after winners are revealed.",
        href: `${base}/awards#showcase`,
        done: showcaseDecisionDone(ctx),
      }),
      step({
        id: "awards-reviewed",
        kind: "recommended",
        label: "Review award categories",
        hint: "Edit the categories your team will vote in.",
        href: `${base}/awards#categories`,
        done: awardsReviewedDone(ctx),
      }),
      step({
        id: "voting-window",
        kind: "recommended",
        label: "Set an optional voting auto-schedule",
        hint: "Pick dates and the system flips voting open/closed for you - or skip it and use the buttons.",
        href: `${base}/awards#voting-window`,
        done: votingWindowDone(ctx),
      }),
      step({
        id: "open-voting",
        kind: "event-day",
        label: "Open voting",
        hint: "Participants vote inside Block +01 once you flip this switch.",
        href: `${base}/awards#voting`,
        done: votingOpenedDone(ctx),
      }),
      step({
        id: "reveal-winners",
        kind: "event-day",
        label: "Close voting & review",
        hint: "Tallies the winners privately and locks the event - nothing is public yet.",
        href: `${base}/awards#voting`,
        done: winnersRevealedDone(ctx),
      }),
      step({
        id: "publish-results",
        kind: "event-day",
        label: "Run the ceremony & publish",
        hint: "Present the winners full-screen, then publish to reveal them to participants and the showcase.",
        href: `${base}/awards#voting`,
        done: resultsPublishedDone(ctx),
      }),
    ],
  );
}

function reflectionsStop(ctx: HelperContext, slug: string): HelperStop {
  const base = `/${slug}/admin`;
  return buildStop(
    "reflections",
    "06",
    "Reflections",
    "Prompts your team answers after the event, plus the AI recap.",
    [
      step({
        id: "reflections-reviewed",
        kind: "recommended",
        label: "Review reflection questions",
        hint: "Tune the prompts participants answer after your event.",
        href: `${base}/reflections#questions`,
        done: reflectionsReviewedDone(ctx),
      }),
      step({
        id: "reflection-window",
        kind: "recommended",
        label: "Set an optional reflection auto-schedule",
        hint: "Pick dates and the system opens/completes reflections for you - or skip it and use the buttons.",
        href: `${base}/reflections#window`,
        done: reflectionWindowDone(ctx),
      }),
      step({
        id: "open-reflections",
        kind: "event-day",
        label: "Open reflections",
        hint: "Participants share their takes inside Block +02 once you open this.",
        href: `${base}/reflections#window`,
        done: reflectionsOpenedDone(ctx),
      }),
      step({
        id: "complete-reflections",
        kind: "event-day",
        label: "Mark reflections complete",
        hint: "Locks submissions and drafts the AI recap from everyone's answers.",
        href: `${base}/reflections#window`,
        done: reflectionsCompleteDone(ctx),
      }),
      step({
        id: "generate-recap",
        kind: "event-day",
        label: "Generate the AI recap",
        hint: "Auto-drafted on complete - regenerate here any time.",
        href: `${base}/reflections#recap`,
        done: recapGeneratedDone(ctx),
      }),
      step({
        id: "approve-recap",
        kind: "event-day",
        label: "Approve the recap",
        hint: "Approve to share with the team. Edit first if you'd like.",
        href: `${base}/reflections#recap`,
        done: recapApprovedDone(ctx),
      }),
    ],
  );
}

// ─────────────────────────────────────────────────────────────────────
// Public composition
// ─────────────────────────────────────────────────────────────────────

/**
 * Compute the six journey stops in sub-nav order. Used by the Helper
 * accordion view to render the checklist.
 */
export function computeHelperStops(
  ctx: HelperContext,
  slug: string,
): HelperStop[] {
  return [
    identityStop(ctx, slug),
    integrationsStop(ctx, slug),
    scheduleStop(ctx, slug),
    teamStop(ctx, slug),
    awardsStop(ctx, slug),
    reflectionsStop(ctx, slug),
  ];
}

/**
 * "Phase 1 complete" semantics: every REQUIRED step across every stop
 * is done. This is the gate that controls whether new admins are
 * bounced to `/admin` from `/dashboard` or `/{slug}`, and whether the
 * participant home shows the setup banner.
 */
export function isPhase1Complete(ctx: HelperContext): boolean {
  const stops = computeHelperStops(ctx, "_");
  return stops.every((s) => s.requiredDone === s.requiredTotal);
}

/**
 * Identify the single step that should get the "Do this next"
 * treatment, in sub-nav order:
 *   1. The first pending REQUIRED step (setup guidance).
 *   2. Once every required step is done AND event day has arrived, the
 *      first pending EVENT-DAY step (open voting → reveal winners →
 *      generate recap → approve recap).
 *   3. Otherwise null - after setup but before event day there's
 *      nothing to force, so the Helper reads "you're set, see you on
 *      event day."
 * Recommended steps never claim "Do this next"; they keep a ghost "Go".
 */
export function nextStep(
  stops: HelperStop[],
  ctx: HelperContext,
  now: Date = new Date(),
): { stopId: HelperStop["id"]; stepId: string } | null {
  for (const stop of stops) {
    for (const step of stop.steps) {
      if (step.kind === "required" && step.state === "pending") {
        return { stopId: stop.id, stepId: step.id };
      }
    }
  }
  if (eventDayReached(ctx, now)) {
    for (const stop of stops) {
      for (const step of stop.steps) {
        if (step.kind === "event-day" && step.state === "pending") {
          return { stopId: stop.id, stepId: step.id };
        }
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Phase detection
// ─────────────────────────────────────────────────────────────────────

/**
 * `now` is injected so callers can stub the clock in tests. Defaults
 * to the current time.
 */
export function computePhase(
  ctx: HelperContext,
  now: Date = new Date(),
): HelperPhase {
  if (
    ctx.event.voting_status === "open" ||
    ctx.event.voting_status === "revealed"
  ) {
    return "wrap-up";
  }

  if (!isPhase1Complete(ctx)) {
    return "setup";
  }

  if (eventInFlight(ctx, now)) {
    return "run-day";
  }

  return "polish";
}

/**
 * "Event in flight" = any scheduled block's window has started but the
 * last scheduled block's window hasn't ended.
 */
function eventInFlight(ctx: HelperContext, now: Date): boolean {
  const t = now.getTime();
  let anyStarted = false;
  let allEnded = true;
  for (const b of ctx.blocks) {
    if (!b.scheduled_date) continue;
    const start = new Date(b.scheduled_date).getTime();
    if (Number.isNaN(start)) continue;
    const duration = b.duration_minutes ?? 30;
    const end = start + duration * 60_000;
    if (t >= start) anyStarted = true;
    if (t < end) allEnded = false;
  }
  return anyStarted && !allEnded;
}

/**
 * "Event day reached" = the day-of actions become relevant. True when
 * any scheduled block has started, when every scheduled block has
 * already ended, or when nothing is scheduled at all. Used to decide
 * whether the "Do this next" nudge advances into the event-day steps,
 * so we never highlight "Open voting" weeks before the event runs.
 */
function eventDayReached(ctx: HelperContext, now: Date = new Date()): boolean {
  const scheduled = ctx.blocks.filter((b) => b.scheduled_date);
  if (scheduled.length === 0) return true;
  const t = now.getTime();
  let anyStarted = false;
  let allEnded = true;
  for (const b of scheduled) {
    const start = new Date(b.scheduled_date as string).getTime();
    if (Number.isNaN(start)) continue;
    const duration = b.duration_minutes ?? 30;
    const end = start + duration * 60_000;
    if (t >= start) anyStarted = true;
    if (t < end) allEnded = false;
  }
  return anyStarted || allEnded;
}

/**
 * Count of REQUIRED steps the admin still needs to do, across all
 * stops. Used by the "N steps left" pill in the sub-nav. Returns 0
 * once Phase 1 is complete - recommended steps don't nag.
 */
export function pendingStepCount(
  ctx: HelperContext,
  _now: Date = new Date(),
): number {
  void _now;
  const stops = computeHelperStops(ctx, "_");
  return stops.reduce(
    (total, stop) => total + (stop.requiredTotal - stop.requiredDone),
    0,
  );
}
