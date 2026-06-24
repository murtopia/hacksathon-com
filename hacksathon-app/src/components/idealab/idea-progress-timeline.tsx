"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScreenshotUploader } from "./screenshot-uploader";
import { CharCounter } from "./char-counter";
import { BlueprintFlowDialog } from "./blueprint-flow-dialog";
import { ProjectBriefCard } from "@/components/planning/project-brief-card";
import { StarterPrompt } from "@/components/planning/starter-prompt";
import { buildToolLabel } from "@/lib/build-tool/labels";
import {
  IDEA_FIELD_LIMITS,
  statusLabel,
  type IdeaStatus,
  type IdeaWithAuthor,
} from "@/lib/idealab/types";
import { isValidHttpUrl } from "@/lib/idealab/url";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";
import type {
  PlanningSession,
  ProjectBrief,
} from "@/lib/planning/types";
import { cn } from "@/lib/utils";

interface IdeaProgressTimelineProps {
  initialIdea: IdeaWithAuthor;
  eventId: string;
  buildTool: string;
  /**
   * Display name of the company / organization hosting this event.
   * Falls back to the event title on the server side. Used in
   * Section 01 intent copy so the participant sees their own IdeaLab
   * named ("Just the basics that will show up in the Acme IdeaLab.").
   */
  companyName: string;
  /** Most recent `project_briefs` row with `is_current = true`, or null. */
  initialBrief: ProjectBrief | null;
  /** The session that produced `initialBrief` (used for Refine Blueprint). */
  briefSession: PlanningSession | null;
  /**
   * A separate `planning_sessions` row in `status != 'completed'`
   * AND with no brief yet - surfaced as a `Resume Blueprint
   * conversation` entry. Falls through to the `Start Blueprint`
   * empty state when null.
   */
  inProgressSession: PlanningSession | null;
}

type DialogMode = "start" | "resume" | "refine";

/**
 * Editorial vertical timeline for the participant's `Your Idea`
 * page. Three native `<details>` rows numbered 01 / 02 / 03, with a
 * left-rail connector and small COMPLETE pills that signal each
 * section's data state at a glance.
 *
 * The component owns ALL owner-editor flows for an idea - what used
 * to live in `IdeaDetail` (title/pitch/description/status/liveUrl
 * editing + screenshot uploader + planning session list) is now
 * routed through here, so `IdeaDetail` can stay focused on the
 * gallery read-only view.
 *
 * Section completion criteria (drives the COMPLETE pill + filled
 * connector dot):
 *
 *   01 Your Project Details - title + pitch + description all non-empty
 *   02 Your Blueprint       - a current `project_briefs` row exists
 *   03 Your Screenshot      - `finalScreenshotUrl` is set
 *
 * Section 02 has three render states (Start / Resume / Refine) and
 * delegates the conversation to `BlueprintFlowDialog`, which hosts
 * `PlanningFlow` in a modal so the page URL stays at `/[slug]/idea`.
 */
export function IdeaProgressTimeline({
  initialIdea,
  eventId,
  buildTool,
  companyName,
  initialBrief,
  briefSession,
  inProgressSession,
}: IdeaProgressTimelineProps) {
  const router = useRouter();

  const [idea, setIdea] = useState<IdeaWithAuthor>(initialIdea);
  const [title, setTitle] = useState(initialIdea.title);
  const [pitch, setPitch] = useState(initialIdea.pitch);
  const [description, setDescription] = useState(initialIdea.description ?? "");
  const [liveUrl, setLiveUrl] = useState(initialIdea.liveUrl ?? "");
  const [status, setStatus] = useState<IdeaStatus>(initialIdea.status);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("start");

  const detailsComplete =
    idea.title.trim().length > 0 &&
    idea.pitch.trim().length > 0 &&
    (idea.description ?? "").trim().length > 0;
  const screenshotComplete = Boolean(idea.finalScreenshotUrl);
  const blueprintComplete = Boolean(initialBrief);

  const hasDemoAssets = Boolean(idea.liveUrl && idea.finalScreenshotUrl);

  // Resolve the session + brief handed to the dialog based on which
  // CTA opened it. Computed at render time so the dialog stays a
  // controlled component driven by `dialogMode`.
  const dialogSession: PlanningSession | null = useMemo(() => {
    if (dialogMode === "refine") return briefSession;
    if (dialogMode === "resume") return inProgressSession;
    return null;
  }, [dialogMode, briefSession, inProgressSession]);

  const dialogBrief: ProjectBrief | null =
    dialogMode === "refine" ? initialBrief : null;

  async function patchIdea(body: Record<string, unknown>) {
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(json.error ?? `Update failed (${res.status})`);
    }
    const json = (await res.json()) as {
      idea: Omit<IdeaWithAuthor, "authorName" | "authorAvatarUrl">;
    };
    return {
      ...json.idea,
      authorName: idea.authorName,
      authorAvatarUrl: idea.authorAvatarUrl,
    };
  }

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function handleSaveDetails() {
    setError(null);

    if (!description.trim()) {
      setError("Add a description so your idea reads well in the IdeaLab.");
      return;
    }

    const trimmedUrl = liveUrl.trim();
    if (trimmedUrl && !isValidHttpUrl(trimmedUrl)) {
      setError(
        "That live URL doesn't look right. Try something like https://your-build.lovable.app",
      );
      return;
    }
    if (
      status === "completed" &&
      !(trimmedUrl && idea.finalScreenshotUrl)
    ) {
      setError(
        "Add a live URL and a screenshot before flipping this to Completed.",
      );
      return;
    }

    const patch: Record<string, unknown> = {};
    if (title.trim() !== idea.title) patch.title = title.trim();
    if (pitch.trim() !== idea.pitch) patch.pitch = pitch.trim();
    const nextDescription = description.trim() || null;
    if (nextDescription !== idea.description) patch.description = nextDescription;
    const nextLiveUrl = trimmedUrl || null;
    if (nextLiveUrl !== idea.liveUrl) patch.liveUrl = nextLiveUrl;
    if (status !== idea.status) patch.status = status;

    if (Object.keys(patch).length === 0) {
      flashSaved();
      return;
    }

    setSaving(true);
    try {
      const updated = await patchIdea(patch);
      setIdea(updated);
      setEditingDetails(false);
      flashSaved();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setTitle(idea.title);
    setPitch(idea.pitch);
    setDescription(idea.description ?? "");
    setLiveUrl(idea.liveUrl ?? "");
    setStatus(idea.status);
    setError(null);
    setEditingDetails(false);
  }

  async function handleScreenshotUploaded(url: string) {
    try {
      const updated = await patchIdea({
        finalScreenshotUrl: url,
        heroCropX: 50,
        heroCropY: 50,
      });
      setIdea(updated);
      router.refresh();
    } catch (err) {
      toast.error("Couldn't save your screenshot.", {
        description: err instanceof Error ? err.message : "Try again?",
      });
    }
  }

  async function handleCropChanged(next: {
    heroCropX?: number;
    heroCropY?: number;
  }) {
    try {
      const updated = await patchIdea(next);
      setIdea(updated);
    } catch (err) {
      toast.error("Couldn't save the crop position.", {
        description: err instanceof Error ? err.message : "Try again?",
      });
    }
  }

  async function handleScreenshotRemoved() {
    try {
      const wasCompleted = idea.status === "completed";
      const updated = await patchIdea({
        finalScreenshotUrl: null,
        heroCropX: 50,
        heroCropY: 50,
        ...(wasCompleted ? { status: "in_progress" as IdeaStatus } : {}),
      });
      setIdea(updated);
      if (wasCompleted) {
        setStatus("in_progress");
        toast.info("Your idea is back to In Progress.");
      }
      router.refresh();
    } catch (err) {
      toast.error("Couldn't remove the screenshot.", {
        description: err instanceof Error ? err.message : "Try again?",
      });
    }
  }

  function openDialog(mode: DialogMode) {
    setDialogMode(mode);
    setDialogOpen(true);
  }

  function handleBriefChanged() {
    // The server-loaded brief/session props refresh via router.refresh
    // - the timeline re-renders with the new Section 02 state.
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <ol
        className={cn(
          "relative pl-16",
          "before:pointer-events-none before:absolute before:left-[18px] before:top-1 before:bottom-1 before:w-px before:bg-border",
          "max-sm:pl-10 max-sm:before:left-[10px]",
        )}
      >
        <TimelineSection
          number="01"
          title="Your Project Details"
          intent={`Just the basics that will show up in the ${companyName} IdeaLab.`}
          complete={detailsComplete}
          defaultOpen
        >
          {editingDetails ? (
          <div className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="title">What should we call it? *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={IDEA_FIELD_LIMITS.title}
                disabled={saving}
              />
              <CharCounter value={title} max={IDEA_FIELD_LIMITS.title} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pitch">
                Give us the teaser - 140 characters or less *
              </Label>
              <Input
                id="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                maxLength={IDEA_FIELD_LIMITS.pitch}
                disabled={saving}
              />
              <CharCounter value={pitch} max={IDEA_FIELD_LIMITS.pitch} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Tell us more about your project *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={IDEA_FIELD_LIMITS.description}
                disabled={saving}
              />
              <CharCounter
                value={description}
                max={IDEA_FIELD_LIMITS.description}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="liveUrl">Live URL</Label>
              <Input
                id="liveUrl"
                type="url"
                inputMode="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://your-build.lovable.app"
                disabled={saving}
              />
              <p className="form-hint">
                Required before you can flip this to Completed.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status">Where&rsquo;s it at?</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as IdeaStatus)}
                disabled={saving}
              >
                <SelectTrigger id="status" className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed" disabled={!hasDemoAssets}>
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="form-hint">
                Flip to <strong>Completed</strong> once your link and
                screenshot are in.
              </p>
            </div>

            {error && (
              <p
                className="border-l-2 border-foreground/40 pl-3 font-serif text-sm italic text-foreground"
                role="alert"
              >
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button variant="pill" size="pill" onClick={handleSaveDetails} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
              {savedFlash && (
                <span className="text-sm text-muted-foreground">Saved it.</span>
              )}
            </div>
          </div>
          ) : (
            <DetailsSummary
              idea={idea}
              onEdit={() => setEditingDetails(true)}
            />
          )}
        </TimelineSection>

        <TimelineSection
          number="02"
          title="Your Blueprint"
          intent={`The one-pager you'll hand to ${buildToolLabel(buildTool)}. We'll talk it through together.`}
          complete={blueprintComplete}
          defaultOpen
        >
          <BlueprintSection
            brief={initialBrief}
            inProgressSession={inProgressSession}
            buildTool={buildTool}
            starterPrompt={briefSession?.starterPromptText ?? null}
            planningSessionId={briefSession?.id ?? null}
            onStart={() => openDialog("start")}
            onResume={() => openDialog("resume")}
            onRefine={() => openDialog("refine")}
          />
        </TimelineSection>

        <TimelineSection
          number="03"
          title="Your Screenshot"
          intent="Drop in a screenshot, logo, or any visual that represents your idea right now."
          complete={screenshotComplete}
          isLast
        >
          <div className="space-y-4">
            <p className="form-hint">
              You can replace it any time. PNG, JPG, WebP, or GIF up to 5&thinsp;MB.
            </p>
            <ScreenshotUploader
              ideaId={idea.id}
              currentUrl={idea.finalScreenshotUrl}
              heroCropX={idea.heroCropX ?? 50}
              heroCropY={idea.heroCropY ?? 50}
              onUploaded={handleScreenshotUploaded}
              onCropChanged={handleCropChanged}
              onRemoved={handleScreenshotRemoved}
              disabled={saving}
            />
          </div>
        </TimelineSection>
      </ol>

      <BlueprintFlowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialSession={dialogSession}
        initialBrief={dialogBrief}
        eventId={eventId}
        ideaId={idea.id}
        buildTool={buildTool}
        onBriefChanged={handleBriefChanged}
        focusMode={dialogMode === "refine" ? "refine" : undefined}
      />
    </div>
  );
}

interface TimelineSectionProps {
  number: string;
  title: string;
  intent?: string;
  complete: boolean;
  isLast?: boolean;
  /**
   * Render the row expanded on first paint. Uses the native `<details
   * open>` attribute, so the participant can still collapse/expand
   * freely - React only writes `open` when the prop value changes.
   */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * A single timeline row. The `<li>` wraps a native `<details>` so the
 * connector dot, header, and body all live in the same DOM container
 * and `group-open` rotations Just Work.
 *
 * Connector dot is filled (black bg) when `complete` is true and
 * outline otherwise - the same terminal/non-terminal contract used by
 * `BlocksTimeline`.
 */
function TimelineSection({
  number,
  title,
  intent,
  complete,
  isLast,
  defaultOpen,
  children,
}: TimelineSectionProps) {
  return (
    <li className={cn("relative", isLast ? "mb-0" : "mb-10")}>
      <span
        aria-hidden
        className={cn(
          "absolute top-[10px] size-[13px] rounded-full border-2 border-foreground bg-background",
          "-left-[52px] max-sm:-left-[34px] max-sm:size-[11px]",
          complete && "bg-foreground",
        )}
      />
      <details className="group/section" open={defaultOpen}>
        <summary
          className={cn(
            "flex cursor-pointer list-none flex-wrap items-baseline gap-4 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2",
            "[&::-webkit-details-marker]:hidden",
            "max-sm:flex-col max-sm:items-start max-sm:gap-1",
          )}
        >
          <span className="min-w-12 font-mono text-sm font-bold uppercase tracking-wide tabular-nums text-foreground">
            {number}
          </span>
          <h3 className="font-serif text-2xl leading-snug text-foreground">
            {title}
          </h3>
          {complete && (
            <span className="self-center rounded-[2px] bg-foreground px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-background">
              Complete
            </span>
          )}
          <ChevronDown
            aria-hidden
            className="ml-auto size-4 text-muted-foreground transition-transform duration-150 group-open/section:rotate-180 max-sm:ml-0"
          />
        </summary>
        {intent && (
          <p className="mt-1 max-w-[640px] font-serif text-sm italic text-muted-foreground/80">
            {intent}
          </p>
        )}
        <div className="mt-4 ml-4 border-l border-border pl-4">{children}</div>
      </details>
    </li>
  );
}

interface DetailsSummaryProps {
  idea: IdeaWithAuthor;
  onEdit: () => void;
}

/**
 * Read-only summary for Section 01. Shows the headline (title) and
 * teaser (pitch) the way they read in the IdeaLab, plus a status pill,
 * the optional description, and an optional live link. `Edit details`
 * swaps this for the editable form in place.
 */
function DetailsSummary({ idea, onEdit }: DetailsSummaryProps) {
  const pitch = idea.pitch?.trim() ?? "";
  const description = idea.description?.trim() ?? "";
  const isCompleted = idea.status === "completed";

  return (
    <div className="space-y-4">
      <div className="min-w-0 space-y-1">
        <h4 className="font-serif text-2xl leading-tight text-foreground">
          {idea.title}
        </h4>
        {pitch && (
          <p className="font-serif text-base leading-relaxed text-foreground/80">
            {pitch}
          </p>
        )}
      </div>

      {description && (
        <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      <div>
        <Badge
          variant={isCompleted ? "default" : "outline"}
          className={
            isCompleted
              ? undefined
              : "border-[var(--gray-400)] text-[var(--gray-400)]"
          }
        >
          {statusLabel(idea.status)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="pill" size="pill" onClick={onEdit}>
          <Pencil aria-hidden />
          Edit details
        </Button>
        {idea.liveUrl && (
          <Button asChild variant="pill" size="pill">
            <a href={idea.liveUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              View live project
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

interface BlueprintSectionProps {
  brief: ProjectBrief | null;
  inProgressSession: PlanningSession | null;
  buildTool: string;
  /**
   * Cached `planning_sessions.starter_prompt_text` for the session
   * tied to `brief`. Non-null on the common path because the dialog's
   * `PlanningFlow` auto-fetches it the moment a Blueprint is
   * generated. Null only when the auto-fetch raced or this is a
   * brief generated on a release before starter-prompt caching.
   */
  starterPrompt: string | null;
  /**
   * Planning session id used for the lazy `POST /api/planning/starter-prompt`
   * fallback when `starterPrompt` is null. Null when no brief
   * exists (and the has-brief branch never renders in that case).
   */
  planningSessionId: string | null;
  onStart: () => void;
  onResume: () => void;
  onRefine: () => void;
}

/**
 * Section 02 body - picks one of three editorial states:
 *
 *   - Empty (no brief, no in-progress session) → intro copy + a
 *     `Start Blueprint` CTA.
 *   - In-progress session, no brief yet → `Resume Blueprint
 *     conversation` CTA.
 *   - Has current brief → see `BlueprintArtifact` for the action-row
 *     + mutually-exclusive view-panel treatment.
 */
function BlueprintSection({
  brief,
  inProgressSession,
  buildTool,
  starterPrompt,
  planningSessionId,
  onStart,
  onResume,
  onRefine,
}: BlueprintSectionProps) {
  if (brief) {
    return (
      <BlueprintArtifact
        brief={brief}
        starterPrompt={starterPrompt}
        planningSessionId={planningSessionId}
        buildTool={buildTool}
        onRefine={onRefine}
      />
    );
  }

  if (inProgressSession) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-[2px] border border-[var(--gray-400)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--gray-400)]">
            In progress
          </span>
          <p className="text-xs text-muted-foreground">
            Last touched {formatRelativeUpdatedAt(inProgressSession.updatedAt)}
          </p>
        </div>
        <p className="font-serif text-base leading-relaxed text-foreground/85">
          You started a conversation but haven&rsquo;t generated a Blueprint
          yet. Pick it back up where you left off.
        </p>
        <div>
          <Button variant="pill" size="pill" onClick={onResume}>
            Resume Blueprint conversation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-serif text-base leading-relaxed text-foreground/85">
        Your Blueprint is the document you hand to your build tool.
        We&rsquo;ll talk it through together, then generate a one-pager you can
        copy straight into {buildToolLabel(buildTool)}.
      </p>
      <div>
        <Button variant="pill" size="pill" onClick={onStart}>
          Start Blueprint
        </Button>
      </div>
    </div>
  );
}

interface BlueprintArtifactProps {
  brief: ProjectBrief;
  starterPrompt: string | null;
  planningSessionId: string | null;
  buildTool: string;
  onRefine: () => void;
}

type ExpandedPanel = "blueprint" | "starter" | null;

/**
 * Has-brief render - project name + the four-button action row +
 * mutually-exclusive expanded panel area below.
 *
 * Two panels share one slot. Opening one auto-collapses the other so
 * the section body never reads as "wall of stuff": at any moment the
 * participant sees either the full Blueprint, the full Starter
 * Prompt, or neither.
 *
 * Starter prompt resolution:
 *   - Server preloaded → the prop is non-null; render immediately.
 *   - Not yet cached (auto-fetch raced or this is a brief generated
 *     on an older release) → on first `View Starter Prompt` click,
 *     POST `/api/planning/starter-prompt`, show the existing
 *     "Preparing…" UI baked into `StarterPrompt`, then resolve + run
 *     `router.refresh()` so the cached column populates for the next
 *     visit.
 */
function BlueprintArtifact({
  brief,
  starterPrompt,
  planningSessionId,
  buildTool,
  onRefine,
}: BlueprintArtifactProps) {
  const router = useRouter();
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [resolvedStarterPrompt, setResolvedStarterPrompt] = useState<
    string | null
  >(starterPrompt);
  const [fetchingStarter, setFetchingStarter] = useState(false);
  const [starterError, setStarterError] = useState<string | null>(null);

  function togglePanel(panel: "blueprint" | "starter") {
    setExpandedPanel((current) => (current === panel ? null : panel));
  }

  async function ensureStarterPrompt() {
    if (resolvedStarterPrompt) return;
    if (fetchingStarter) return;
    if (!planningSessionId) return;
    setFetchingStarter(true);
    setStarterError(null);
    try {
      const res = await fetch("/api/planning/starter-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningSessionId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { starterPrompt: string };
      setResolvedStarterPrompt(data.starterPrompt);
      // Cache the column for subsequent page loads. router.refresh
      // re-runs the server component without forcing a full
      // navigation, so our expanded panel state stays put.
      router.refresh();
    } catch (err) {
      setStarterError(
        err instanceof Error
          ? err.message
          : "Couldn't prepare your Starter Prompt.",
      );
    } finally {
      setFetchingStarter(false);
    }
  }

  function handleViewStarter() {
    togglePanel("starter");
    void ensureStarterPrompt();
  }

  function handleDownload() {
    downloadBriefMarkdown(brief);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-serif text-xl leading-tight text-foreground">
          {brief.projectName}
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated {formatRelativeUpdatedAt(brief.updatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="pill"
          size="pill"
          onClick={() => togglePanel("blueprint")}
        >
          {expandedPanel === "blueprint" ? "Hide Blueprint" : "View Blueprint"}
        </Button>
        <Button
          variant="pill"
          size="pill"
          onClick={handleDownload}
          disabled={!brief.prdMarkdown}
        >
          Download Blueprint
        </Button>
        <Button variant="pill" size="pill" onClick={handleViewStarter}>
          {expandedPanel === "starter"
            ? "Hide Starter Prompt"
            : "View Starter Prompt"}
        </Button>
        <Button variant="pill" size="pill" onClick={onRefine}>
          Refine Blueprint
        </Button>
      </div>

      {expandedPanel === "blueprint" && (
        <ProjectBriefCardInline brief={brief} />
      )}

      {expandedPanel === "starter" && (
        <StarterPrompt
          prompt={resolvedStarterPrompt}
          error={starterError}
          onRetry={ensureStarterPrompt}
          buildTool={buildTool}
        />
      )}
    </div>
  );
}

/**
 * Thin wrapper around `ProjectBriefCard` that provides the standard
 * copy / download / save-as-pdf handlers using the brief's
 * `prdMarkdown` directly. Used by the `View Blueprint` panel so the
 * expanded view still ships the same `/plan`-style action row inside
 * the card.
 */
function ProjectBriefCardInline({ brief }: { brief: ProjectBrief }) {
  function copy() {
    if (!brief.prdMarkdown) return;
    void navigator.clipboard.writeText(brief.prdMarkdown);
  }
  function pdf() {
    if (!brief.prdMarkdown) return;
    document.documentElement.classList.add("printing-blueprint");
    const cleanup = () => {
      document.documentElement.classList.remove("printing-blueprint");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    // Wait a frame so the print-only layout is applied before the dialog
    // opens, otherwise some browsers capture the pre-layout (blank) state.
    requestAnimationFrame(() => window.print());
  }

  // The print stylesheet hides everything except `.print-blueprint-area`
  // (see globals.css). Without this wrapper, "Save as PDF" from the
  // timeline printed an empty page.
  return (
    <div className="print-blueprint-area">
      <ProjectBriefCard
        brief={brief}
        onCopyBlueprint={copy}
        onDownloadPrd={() => downloadBriefMarkdown(brief)}
        onSaveAsPdf={pdf}
      />
    </div>
  );
}

/**
 * Shared `.md` download handler used by both the section-level
 * `Download Blueprint` button and the in-card `Download .md` action.
 * Kept as a free function so both surfaces stay in sync if filename
 * conventions ever change.
 */
function downloadBriefMarkdown(brief: ProjectBrief) {
  if (!brief.prdMarkdown) return;
  const blob = new Blob([brief.prdMarkdown], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugifyForFilename(brief.projectName)}-Blueprint.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function slugifyForFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}
