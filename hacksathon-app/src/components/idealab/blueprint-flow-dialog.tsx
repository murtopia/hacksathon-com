"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlanningFlow } from "@/components/planning/planning-flow";
import { createPlanningSession } from "@/lib/planning/ensure-session";
import type {
  PlanningSession,
  ProjectBrief,
} from "@/lib/planning/types";

interface BlueprintFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Pre-loaded planning session row (camelCased). When non-null the
   * dialog hydrates `PlanningFlow` with it directly; this is what
   * powers the `Resume Blueprint conversation` and `Refine Blueprint`
   * entry points. When null, the dialog lazily creates a fresh
   * session via `createPlanningSession` the first time it opens.
   */
  initialSession: PlanningSession | null;
  /**
   * Pre-loaded current brief - only set when entering the dialog via
   * `Refine Blueprint`. PlanningFlow uses it to render in post-PRD
   * mode (Blueprint card + post-PRD chat below).
   */
  initialBrief: ProjectBrief | null;
  eventId: string;
  ideaId: string;
  buildTool: string;
  /**
   * Called after a successful Blueprint generation / update. The
   * timeline owner refetches via `router.refresh()` and re-renders
   * Section 03 with the artifact; the dialog closes itself.
   */
  onBriefChanged: (brief: ProjectBrief) => void;
  /**
   * Forwarded to `PlanningFlow`. The timeline sets this to "refine"
   * when the dialog was opened via the Refine Blueprint CTA so the
   * conversation opens to a fresh refinement turn instead of
   * re-rendering the entire pre-Blueprint chat + Blueprint card.
   */
  focusMode?: "refine";
}

/**
 * Modal host for the Blueprint planning conversation.
 *
 * Shape mirrors the gallery details modal (sticky header band on top,
 * scrollable body below, custom close X because the sticky band
 * paints over the default one) but at a larger `max-w-4xl` because
 * the chat needs room to breathe.
 *
 * Session bootstrap:
 *   - `initialSession` non-null → render PlanningFlow immediately
 *     using that session (Resume / Refine entry points).
 *   - `initialSession` null → on first open, call
 *     `createPlanningSession()` and render PlanningFlow with the
 *     fresh row (Start Blueprint entry point).
 *
 * The dialog deliberately does NOT push `?session=` into the URL -
 * the participant is on `/[slug]/idea` and that's where they should
 * stay if the page reloads.
 *
 * On a fresh Blueprint generation or update, `PlanningFlow` fires
 * `onBriefChanged`; we propagate that to the parent and close the
 * dialog so Section 03 of the timeline re-renders in the
 * `Has current brief` state.
 */
export function BlueprintFlowDialog({
  open,
  onOpenChange,
  initialSession,
  initialBrief,
  eventId,
  ideaId,
  buildTool,
  onBriefChanged,
  focusMode,
}: BlueprintFlowDialogProps) {
  // Locally-created session for the `Start Blueprint` entry point.
  // For `Resume` and `Refine`, the parent passes a pre-loaded
  // `initialSession` directly and we never touch this state.
  const [freshSession, setFreshSession] = useState<PlanningSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Ref-based in-flight guard so the effect body itself never calls
  // setState synchronously (the React 19 lint rule flags that). The
  // .then / .catch callbacks below run asynchronously after the
  // effect returns, which is the canonical setState site.
  const creating = useRef(false);

  const session = initialSession ?? freshSession;

  // Lazy session creation. Runs the first time the dialog opens
  // without an `initialSession`. Once the session row exists for
  // this idea, the page-level loader picks it up as
  // `inProgressSession` on the next router.refresh and subsequent
  // openings come through the Resume entry point with a non-null
  // `initialSession` - so this effect quietly stops mattering.
  useEffect(() => {
    if (!open) return;
    if (initialSession) return;
    if (freshSession) return;
    if (errorMessage) return;
    if (creating.current) return;
    creating.current = true;
    createPlanningSession({ eventId, ideaId, buildTool })
      .then((created) => {
        setFreshSession(created);
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Couldn't start the planning session.",
        );
      })
      .finally(() => {
        creating.current = false;
      });
  }, [
    open,
    initialSession,
    freshSession,
    errorMessage,
    eventId,
    ideaId,
    buildTool,
  ]);

  const handleBriefChanged = useCallback(
    (next: ProjectBrief) => {
      onBriefChanged(next);
      onOpenChange(false);
    },
    [onBriefChanged, onOpenChange],
  );

  // Clearing the error lets the lazy-creation effect run again (it bails
  // while an error is set), so this doubles as the Retry trigger.
  const handleRetry = useCallback(() => {
    creating.current = false;
    setErrorMessage(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid w-full max-w-[calc(100%-2rem)] max-h-[90vh] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-background px-6 py-5">
          <div className="space-y-1">
            <DialogTitle className="font-serif text-2xl leading-tight text-foreground">
              Your Blueprint
            </DialogTitle>
            <p className="font-serif text-sm text-muted-foreground">
              Talk it through. We&rsquo;ll generate a Blueprint when you&rsquo;re ready.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {errorMessage ? (
            <div className="mt-12 flex flex-col items-center gap-4 text-center">
              <p className="font-serif text-base text-muted-foreground">
                {errorMessage}
              </p>
              <Button variant="pill" size="pill" onClick={handleRetry}>
                Try again
              </Button>
            </div>
          ) : !session ? (
            <div className="mt-12 text-center">
              <div
                className="inline-block size-6 animate-spin rounded-full border-2"
                style={{
                  borderColor: "var(--border-default)",
                  borderTopColor: "var(--text-primary)",
                }}
              />
              <p className="mt-4 mono-label">Starting your planning session…</p>
            </div>
          ) : (
            <PlanningFlow
              session={session}
              initialBrief={initialBrief}
              onBriefChanged={handleBriefChanged}
              focusMode={focusMode}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
