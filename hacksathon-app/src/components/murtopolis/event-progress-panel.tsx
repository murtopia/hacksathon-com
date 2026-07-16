import { Badge } from "@/components/ui/badge";
import { Panel, PhaseBadge } from "@/components/murtopolis/panel";
import type { EventProgress } from "@/lib/murtopolis/queries";
import { formatDate, formatNumber } from "@/lib/murtopolis/format";

/**
 * "Event progress" panel on the Murtopolis customer detail page: setup
 * checklist state (exactly as the customer's own Hacky Helper computes
 * it), block schedule window, engagement funnel, and roadblock flags.
 * Server component - pure rendering of a precomputed EventProgress.
 */

const NEXT_BLOCK_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
  timeZoneName: "short",
});

function statusBadgeVariant(
  status: string,
): "default" | "outline" | "secondary" {
  if (status === "open") return "default";
  if (status === "closed") return "outline";
  return "secondary";
}

export function EventProgressPanel({
  progress,
  showEventTitle,
}: {
  progress: EventProgress;
  showEventTitle: boolean;
}) {
  const {
    phase,
    requiredDone,
    requiredTotal,
    pendingSteps,
    scheduledBlocks,
    totalBlocks,
    windowStart,
    windowEnd,
    nextBlock,
    votingStatus,
    reflectionStatus,
    activeMembers,
    funnel,
    flags,
  } = progress;

  const funnelStages: { label: string; count: number }[] = [
    { label: "Invited", count: funnel.invited },
    { label: "Joined", count: funnel.joined },
    { label: "Posted idea", count: funnel.postedIdea },
    { label: "Blueprint", count: funnel.generatedBlueprint },
    { label: "Voted", count: funnel.voted },
    { label: "Reflected", count: funnel.reflected },
  ];

  return (
    <Panel
      title={
        showEventTitle
          ? `Event progress - ${progress.eventTitle}`
          : "Event progress"
      }
      description="Setup state, schedule, and engagement - as the customer's own Hacky Helper sees it."
    >
      <div className="space-y-6">
        {/* Setup */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mono-label" style={{ color: "var(--text-tertiary)" }}>
              Setup
            </span>
            <PhaseBadge phase={phase} />
            <span className="text-sm text-foreground">
              {formatNumber(requiredDone)} of {formatNumber(requiredTotal)}{" "}
              required steps done
            </span>
          </div>
          {pendingSteps.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {pendingSteps.map((step) => (
                <span
                  key={step.label}
                  className="inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {step.label}
                  {step.kind === "recommended" && (
                    <span className="text-[var(--text-tertiary)]">
                      · optional
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Every setup step is done.
            </p>
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mono-label" style={{ color: "var(--text-tertiary)" }}>
              Schedule
            </span>
            <span className="text-sm text-foreground">
              {formatNumber(scheduledBlocks)} of {formatNumber(totalBlocks)}{" "}
              blocks scheduled
            </span>
            {windowStart && (
              <span className="text-sm text-muted-foreground">
                {formatDate(windowStart)}
                {windowEnd && windowEnd !== windowStart
                  ? ` to ${formatDate(windowEnd)}`
                  : ""}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {nextBlock && (
              <span>
                Next: {nextBlock.title} ·{" "}
                {NEXT_BLOCK_FORMAT.format(new Date(nextBlock.scheduledAt))}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              Voting
              <Badge variant={statusBadgeVariant(votingStatus)}>
                {votingStatus}
              </Badge>
            </span>
            <span className="inline-flex items-center gap-1.5">
              Reflections
              <Badge variant={statusBadgeVariant(reflectionStatus)}>
                {reflectionStatus}
              </Badge>
            </span>
          </div>
        </div>

        {/* Engagement funnel */}
        <div className="space-y-2">
          <span className="mono-label" style={{ color: "var(--text-tertiary)" }}>
            Engagement
          </span>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="rounded-[4px] border px-3 py-2">
                <p className="font-mono text-lg tabular-nums text-foreground">
                  {formatNumber(stage.count)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {stage.label}
                </p>
                {activeMembers > 0 && stage.label !== "Invited" && (
                  <p className="font-mono text-[11px] tabular-nums text-[var(--text-tertiary)]">
                    {Math.round((stage.count / activeMembers) * 100)}%
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Percentages are of {formatNumber(activeMembers)} active{" "}
            {activeMembers === 1 ? "member" : "members"}.
          </p>
        </div>

        {/* Flags */}
        <div className="space-y-2">
          <span className="mono-label" style={{ color: "var(--text-tertiary)" }}>
            Flags
          </span>
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roadblocks detected.
            </p>
          ) : (
            <ul className="divide-y rounded-[4px] border">
              {flags.map((flag) => (
                <li
                  key={flag.key}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground"
                >
                  <span
                    aria-hidden
                    className={
                      flag.severity === "warn"
                        ? "size-2 shrink-0 rounded-full bg-red-500"
                        : "size-2 shrink-0 rounded-full bg-[var(--text-tertiary)]"
                    }
                  />
                  {flag.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
