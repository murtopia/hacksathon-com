import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeHelperStops,
  computePhase,
  nextStep,
  type HelperContext,
  type HelperStep,
  type HelperStop,
} from "@/lib/helper/phase";

interface HackyHelperProps {
  ctx: HelperContext;
  slug: string;
  /** Truthy when the URL search param `?helper=collapsed` is set. */
  collapsed?: boolean;
}

/**
 * Hacky Helper - the "what's next" surface mounted at the top of
 * `/{slug}/admin`. A single, always-on editorial walkthrough of the six
 * journey stops (01 Identity → 06 Reflections), each rendered as an
 * expandable accordion containing a vertical timeline of steps.
 *
 * The same six stops render at every phase - nothing swaps out. Each
 * stop is open by default and the admin collapses it once they're done
 * with that section. Steps come in three flavours:
 *   - required    → must be done before launch; gates the dashboard
 *                   redirect. Solid marker.
 *   - recommended → optional polish. Dashed marker, "Optional" tag.
 *   - event-day   → day-of actions (open voting, reveal winners,
 *                   generate + approve recap) folded into Hacky Awards
 *                   and Reflections. Solid marker, "Event day" tag.
 *
 * Exactly one pending step gets the primary "Do this next" button: the
 * first pending required step while setting up, then the first pending
 * event-day step once setup is done and the event has run. Every other
 * pending step keeps a ghost "Go".
 *
 * Pure server component - no client interactivity beyond Link clicks
 * and the native `<details>` accordion toggles.
 */
export function HackyHelper({ ctx, slug, collapsed = false }: HackyHelperProps) {
  const phase = computePhase(ctx);
  const stops = computeHelperStops(ctx, slug);
  const next = nextStep(stops, ctx);
  const stage = resolveStage(stops, next, phase);

  return (
    <HelperShell
      slug={slug}
      title={titleForStage(stage)}
      blurb={blurbForStage(stage, stops)}
      collapsed={collapsed}
    >
      <ol className="divide-y border-y">
        {stops.map((stop) => {
          const containsNext = next?.stopId === stop.id;
          return (
            <StopAccordion
              key={stop.id}
              stop={stop}
              highlight={containsNext}
              nextStepId={containsNext ? next?.stepId ?? null : null}
              defaultOpen={!collapsed}
            />
          );
        })}
      </ol>
    </HelperShell>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────────────

interface HelperShellProps {
  slug: string;
  title: string;
  blurb: string;
  /** When true the sections render collapsed and the toggle reads "Expand". */
  collapsed: boolean;
  children: React.ReactNode;
}

function HelperShell({
  slug,
  title,
  blurb,
  collapsed,
  children,
}: HelperShellProps) {
  const base = `/${slug}/admin`;
  const toggleHref = collapsed
    ? `${base}#hacky-helper`
    : `${base}?helper=collapsed#hacky-helper`;
  return (
    <section
      id="hacky-helper"
      className="max-w-[var(--container-narrow)] scroll-mt-24"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <p
            className="mono-label inline-flex items-center gap-1.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Compass className="size-3" />
            Hacky Helper
          </p>
          <h3 className="font-serif text-xl leading-snug">{title}</h3>
          <p className="max-w-[560px] font-serif text-sm italic text-muted-foreground/80">
            {blurb}
          </p>
        </div>
        <Link
          href={toggleHref}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          aria-label={
            collapsed ? "Expand all Hacky Helper sections" : "Collapse all Hacky Helper sections"
          }
        >
          {collapsed ? (
            <>
              Expand
              <ChevronDown className="size-3" />
            </>
          ) : (
            <>
              Collapse
              <ChevronUp className="size-3" />
            </>
          )}
        </Link>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stop accordion (sub-nav-aligned)
// ─────────────────────────────────────────────────────────────────────

function StopAccordion({
  stop,
  highlight,
  nextStepId,
  defaultOpen,
}: {
  stop: HelperStop;
  highlight: boolean;
  nextStepId: string | null;
  defaultOpen: boolean;
}) {
  const isComplete = stop.done === stop.total;

  return (
    <li
      className={cn(
        "group/stop pl-3",
        highlight && "shadow-[inset_2px_0_0_0_var(--foreground)]",
      )}
    >
      <details open={defaultOpen} className="group/details">
        <summary
          className={cn(
            "flex cursor-pointer list-none items-center gap-3 py-3",
            "[&::-webkit-details-marker]:hidden",
          )}
        >
          <span
            aria-hidden
            className="font-mono text-sm font-bold tabular-nums text-foreground"
          >
            {stop.number}
          </span>
          <h4 className="font-serif text-base leading-snug text-muted-foreground transition-colors group-hover/stop:text-foreground group-open/details:text-foreground">
            {stop.title}
          </h4>
          <StopCountBadge stop={stop} />
          <span className="ml-auto inline-flex items-center gap-2">
            {isComplete && (
              <span
                aria-hidden
                className="inline-flex size-4 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--foreground)" }}
              >
                <Check className="size-2.5 text-background" />
              </span>
            )}
            <ChevronDown
              aria-hidden
              className="size-4 text-muted-foreground transition-transform duration-150 group-open/details:rotate-180"
            />
          </span>
        </summary>

        <div className="pb-5 pt-1">
          {stop.blurb && (
            <p
              className="mb-3 max-w-[560px] font-serif text-xs italic"
              style={{ color: "var(--text-tertiary)" }}
            >
              {stop.blurb}
            </p>
          )}
          <StepTimeline steps={stop.steps} nextStepId={nextStepId} />
        </div>
      </details>
    </li>
  );
}

function StopCountBadge({ stop }: { stop: HelperStop }) {
  return (
    <span
      className="ml-1 inline-flex items-center font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums"
      style={{ color: "var(--text-tertiary)" }}
    >
      {stop.done} of {stop.total} done
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Step timeline (rail + circles, mirroring BlocksTimeline)
// ─────────────────────────────────────────────────────────────────────

function StepTimeline({
  steps,
  nextStepId,
}: {
  steps: HelperStep[];
  nextStepId: string | null;
}) {
  return (
    <ol
      className={cn(
        "relative pl-10",
        "before:pointer-events-none before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-px before:bg-border",
      )}
    >
      {steps.map((step) => (
        <StepRow
          key={step.id}
          step={step}
          isDoNext={step.id === nextStepId}
        />
      ))}
    </ol>
  );
}

function StepRow({
  step,
  isDoNext,
}: {
  step: HelperStep;
  isDoNext: boolean;
}) {
  const isDone = step.state === "done";
  const tag =
    step.kind === "recommended"
      ? "Optional"
      : step.kind === "event-day"
        ? "Event day"
        : null;

  return (
    <li className="relative mb-5 last:mb-0">
      <StepConnector kind={step.kind} state={step.state} />
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 pt-px">
          <div className="flex flex-wrap items-baseline gap-2">
            <p
              className={cn(
                "text-sm leading-snug",
                isDone
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {step.label}
            </p>
            {tag && (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {tag}
              </span>
            )}
          </div>
          {step.hint && !isDone && (
            <p className="mt-0.5 font-serif text-xs italic text-muted-foreground/80">
              {step.hint}
            </p>
          )}
        </div>
        {!isDone && (
          <Button
            asChild
            size={isDoNext ? "pill" : "sm"}
            variant={isDoNext ? "pill" : "outline"}
            className="shrink-0"
          >
            <Link href={step.href}>
              {isDoNext ? (
                <>
                  Do this next
                  <ArrowRight className="size-3" />
                </>
              ) : (
                "Go"
              )}
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function StepConnector({
  kind,
  state,
}: {
  kind: HelperStep["kind"];
  state: HelperStep["state"];
}) {
  const isDone = state === "done";
  const isOptional = kind === "recommended";

  if (isDone) {
    return (
      <span
        aria-hidden
        className="absolute top-1.5 -left-[34px] inline-flex size-[14px] items-center justify-center rounded-full"
        style={{
          backgroundColor: "var(--foreground)",
          border: "1.5px solid var(--foreground)",
        }}
      >
        <Check className="size-2 text-background" />
      </span>
    );
  }

  if (isOptional) {
    return (
      <span
        aria-hidden
        className="absolute top-2 -left-[32px] inline-flex size-[10px] rounded-full"
        style={{
          border: "1.5px dashed var(--gray-400, var(--border-color))",
          backgroundColor: "var(--background)",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="absolute top-1.5 -left-[34px] inline-flex size-[14px] rounded-full"
      style={{
        border: "1.5px solid var(--foreground)",
        backgroundColor: "var(--background)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Copy
// ─────────────────────────────────────────────────────────────────────

/**
 * The single always-on list reads in one of three stages, derived from
 * the step state rather than swapping views:
 *   - "setup"     → at least one required step is still pending.
 *   - "ready"     → required work is done but the event hasn't run yet.
 *   - "event-day" → the event has run (or voting is live): the day-of
 *                   steps are now the focus.
 */
type HelperStage = "setup" | "ready" | "event-day";

function resolveStage(
  stops: HelperStop[],
  next: { stopId: HelperStop["id"]; stepId: string } | null,
  phase: ReturnType<typeof computePhase>,
): HelperStage {
  const remainingRequired = remainingRequiredCount(stops);
  if (remainingRequired > 0) return "setup";
  const nextIsEventDay = next
    ? stops
        .find((s) => s.id === next.stopId)
        ?.steps.find((st) => st.id === next.stepId)?.kind === "event-day"
    : false;
  if (phase === "run-day" || phase === "wrap-up" || nextIsEventDay) {
    return "event-day";
  }
  return "ready";
}

function remainingRequiredCount(stops: HelperStop[]): number {
  return stops.reduce(
    (sum, s) => sum + (s.requiredTotal - s.requiredDone),
    0,
  );
}

function titleForStage(stage: HelperStage): string {
  switch (stage) {
    case "setup":
      return "Set up your Hacks-a-Thon";
    case "ready":
      return "You're all set - see you on event day";
    case "event-day":
      return "Event day - wrap it up";
  }
}

function blurbForStage(stage: HelperStage, stops: HelperStop[]): string {
  if (stage === "setup") {
    const remaining = remainingRequiredCount(stops);
    return `${remaining} required ${
      remaining === 1 ? "step" : "steps"
    } left. Click "Do this next" to keep moving - optional steps you can skip or come back to.`;
  }
  if (stage === "ready") {
    return "Participants move through the blocks on their own - nothing special for you to do during the event itself. Optional polish is below; the event-day steps unlock once your hackathon runs.";
  }
  return "Open voting, reveal winners, then ship the AI recap. Earlier sections stay here if you need to revisit them.";
}
