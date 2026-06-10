"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AIMessage } from "./ai-message";
import { UserInput } from "./user-input";
import { PostPrdInput } from "./post-prd-input";
import { ProjectBriefCard } from "./project-brief-card";
import { StarterPrompt } from "./starter-prompt";
import type {
  PlanningSession,
  Message,
  ProjectBrief,
} from "@/lib/planning/types";

interface PlanningFlowProps {
  session: PlanningSession;
  initialBrief?: ProjectBrief | null;
  /**
   * Optional callback fired after a successful Blueprint
   * generation or update. The standalone `/plan` page leaves this
   * unset (it keeps the participant in the same surface, post-PRD
   * refinement loop and all). The `BlueprintFlowDialog` provides
   * one so it can close itself and hand control back to the host
   * timeline, which then re-renders Section 03 with the artifact.
   */
  onBriefChanged?: (brief: ProjectBrief) => void;
  /**
   * When set to "refine", the post-Blueprint refinement experience
   * renders without the original pre-Blueprint chat or the inline
   * Blueprint/Starter Prompt artifacts. The participant sees only a
   * fresh AI invitation, the refinement input, and the Update CTA -
   * because they've already seen the Blueprint via the Section 02
   * action buttons before opening this modal. Default (undefined)
   * preserves the full historical render used by `/plan` and the
   * Start/Resume dialog entries.
   */
  focusMode?: "refine";
}

/**
 * Heuristic for detecting when the AI has signaled the conversation has
 * enough material to generate the Blueprint. Strike Mission's session
 * ended with "That's everything I need. Ready to turn this into a build
 * plan?" - exactly the kind of phrasing this matches. Purely visual: when
 * matched, the persistent CTA upgrades to primary styling. The button is
 * always clickable regardless.
 */
const READY_PHRASES = [
  /\bthat[''']s everything i need\b/i,
  /\bi (?:have|'ve got) (?:everything|all) i need\b/i,
  /\bready to (?:turn|draft|build|generate|put|create) (?:this|it)\b/i,
  /\bready to (?:generate|create|build) (?:your|the|this) (?:blueprint|plan|prd)\b/i,
  /\bhit (?:generate|the generate)\b/i,
  /\bgenerate (?:your|my|the) blueprint\b/i,
];

/**
 * Mirror of READY_PHRASES but for the post-Blueprint refinement loop.
 * Matches the phrases the AI uses when it has fully captured a requested
 * change and is inviting the participant to commit the update.
 */
const POST_PRD_READY_PHRASES = [
  /\b(?:roll|fold|bake) (?:those|that|these|it|them) (?:in|into)\b/i,
  /\b(?:ready|want me) to update (?:your|the) blueprint\b/i,
  /\bhit (?:update|the update)\b/i,
  /\bupdate (?:your|my|the) blueprint\b/i,
  /\bcaptured? (?:all|everything|the) (?:that|change|changes?)\b/i,
  /\bthat (?:captures|covers) (?:the|that|those) changes?\b/i,
];

function isReadySignal(text: string): boolean {
  return READY_PHRASES.some((re) => re.test(text));
}

function isReadyToUpdateSignal(text: string): boolean {
  return POST_PRD_READY_PHRASES.some((re) => re.test(text));
}

export function PlanningFlow({
  session: initialSession,
  initialBrief = null,
  onBriefChanged,
  focusMode,
}: PlanningFlowProps) {
  const [session, setSession] = useState(initialSession);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [brief, setBrief] = useState<ProjectBrief | null>(initialBrief);
  const [briefGenerating, setBriefGenerating] = useState(false);
  const [briefUpdating, setBriefUpdating] = useState(false);
  const [starterPrompt, setStarterPrompt] = useState<string | null>(null);
  const [starterPromptError, setStarterPromptError] = useState<string | null>(
    null
  );
  /**
   * Tracks the most recent stream failure so we can show an inline error
   * card with a Retry affordance - instead of the silent empty-bubble
   * failure mode we hit when an Anthropic model ID was invalid.
   */
  const [streamError, setStreamError] = useState<{
    message: string;
    retry: () => Promise<void>;
  } | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);

  /**
   * Snapshot of conversationHistory.length at the moment the most recent
   * Blueprint was generated/updated. Used to detect post-Blueprint
   * continuation: the conversation has new messages worth committing to
   * a Blueprint update.
   */
  const [briefSnapshotLength, setBriefSnapshotLength] = useState<number | null>(
    initialBrief ? initialSession.conversationHistory.length : null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const postMessagesEndRef = useRef<HTMLDivElement>(null);
  const blueprintRef = useRef<HTMLDivElement>(null);
  /**
   * Set true the moment a fresh Blueprint generation completes, so a
   * post-render effect can scroll the card into view. Without this, the
   * Blueprint card materialized above the conversation and the user was
   * left reading the post-Blueprint input at the bottom of the page,
   * thinking nothing happened.
   */
  const shouldScrollToBlueprint = useRef(false);

  const isPostPrd = !!brief && session.status === "complete";
  const hasPostPrdMessages =
    isPostPrd &&
    briefSnapshotLength !== null &&
    session.conversationHistory.length > briefSnapshotLength;

  // Snapshot the conversation length whenever a new brief becomes available
  // (initial load, fresh generation, or regeneration). Driven by brief
  // identity + updatedAt so we capture all three cases reliably.
  useEffect(() => {
    if (!brief) return;
    setBriefSnapshotLength(session.conversationHistory.length);

    // Scroll the Blueprint into view after fresh generation/update so it's
    // unmissable. We gate on a flag instead of firing on every brief
    // mount - initial page loads with an existing brief shouldn't yank
    // the user past the conversation they were reading.
    if (shouldScrollToBlueprint.current) {
      shouldScrollToBlueprint.current = false;
      // requestAnimationFrame ensures the new layout (with the rendered
      // card) has committed before we measure for scroll position.
      requestAnimationFrame(() => {
        blueprintRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief?.id, brief?.updatedAt]);

  // Auto-scroll target depends on the mode: in post-Blueprint refinement
  // the live conversation lives below the Blueprint, so we need to scroll
  // that anchor (not the original messages-end anchor at the top) to keep
  // the latest AI reply + input in view.
  const scrollToBottom = useCallback(() => {
    const target =
      isPostPrd && hasPostPrdMessages
        ? postMessagesEndRef.current
        : messagesEndRef.current;
    target?.scrollIntoView({ behavior: "smooth" });
  }, [isPostPrd, hasPostPrdMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [session.conversationHistory, streamingText, scrollToBottom]);

  // Detect "ready to generate" signal in the most recent assistant turn
  // so the persistent CTA can upgrade to primary styling.
  const isReadyToGenerate = useMemo(() => {
    if (isPostPrd) return false;
    const lastAssistant = [...session.conversationHistory]
      .reverse()
      .find((m) => m.role === "assistant");
    return lastAssistant ? isReadySignal(lastAssistant.content) : false;
  }, [session.conversationHistory, isPostPrd]);

  // Mirror of isReadyToGenerate, scoped to assistant messages that arrived
  // AFTER the most recent Blueprint snapshot. We don't want a "ready"
  // phrase from the original Blueprint conversation to keep the Update CTA
  // permanently primary.
  const isReadyToUpdate = useMemo(() => {
    if (!isPostPrd || briefSnapshotLength === null) return false;
    const postSlice = session.conversationHistory.slice(briefSnapshotLength);
    const lastAssistant = [...postSlice]
      .reverse()
      .find((m) => m.role === "assistant");
    return lastAssistant ? isReadyToUpdateSignal(lastAssistant.content) : false;
  }, [session.conversationHistory, briefSnapshotLength, isPostPrd]);

  /**
   * Send a turn to the planning step API. Pass `userMessage` for a new
   * user turn; omit it for a retry (re-streams from existing history).
   */
  async function callStepAPI(userMessage?: string) {
    setIsStreaming(true);
    setStreamingText("");
    setStreamError(null);

    const failWith = (message: string) => {
      // Retry re-runs the call without the userMessage so the server
      // doesn't re-append it (the user message was already persisted on
      // the first call).
      setStreamError({ message, retry: () => callStepAPI() });
      setStreamingText("");
      setIsStreaming(false);
    };

    try {
      const res = await fetch("/api/planning/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningSessionId: session.id,
          userMessage,
        }),
      });

      if (!res.ok || !res.body) {
        failWith(
          "Something went wrong reaching the planning model. Try again?"
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamingText(fullText);
      }

      // An empty stream means the model errored before producing text
      // (server logs the cause via onError). Skip the empty bubble and
      // surface a retry instead of silently breaking the conversation.
      if (!fullText.trim()) {
        failWith(
          "The planning model didn't respond. This usually clears up on retry."
        );
        return;
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: fullText,
        messageType: "reflection",
      };

      setSession((prev) => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, assistantMsg],
      }));
      setStreamingText("");
      setIsStreaming(false);
    } catch {
      failWith("Network hiccup while streaming. Try again?");
    }
  }

  function handleSend(message: string) {
    const userMsg: Message = {
      role: "user",
      content: message,
      messageType: "user_response",
    };

    setSession((prev) => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, userMsg],
    }));

    callStepAPI(message);
  }

  async function generateBrief() {
    setBriefGenerating(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/planning/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningSessionId: session.id }),
      });

      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeBrief(data.brief);
        // Mark this as a fresh generation so the brief-watching useEffect
        // smooth-scrolls the card into view post-render.
        shouldScrollToBlueprint.current = true;
        setBrief(normalized);
        setSession((prev) => ({
          ...prev,
          status: "complete",
          briefId: normalized.id,
        }));
        // Snapshot is set in a useEffect tied to brief.id/updatedAt so we
        // capture the latest history length post-render.

        // Eagerly fetch the Starter Prompt so it's already populated when
        // the participant sees the Blueprint render. The route is
        // idempotent and caches in planning_sessions.starter_prompt_text.
        fetchStarterPrompt();

        // Surface the fresh brief to the host (e.g. the BlueprintFlowDialog,
        // which uses this signal to close itself and let the timeline
        // re-render Section 03 with the artifact). Fired AFTER local state
        // is updated so the standalone /plan page's render also picks up
        // the change.
        onBriefChanged?.(normalized);
      } else {
        const data = await res.json().catch(() => ({}));
        setBriefError(
          data?.error ??
            "We couldn't generate your Blueprint right now. Please try again."
        );
      }
    } catch {
      setBriefError(
        "We couldn't generate your Blueprint right now. Please try again."
      );
    } finally {
      setBriefGenerating(false);
    }
  }

  async function handleUpdatePrd() {
    setBriefUpdating(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/planning/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningSessionId: session.id,
          regenerate: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Same scroll-into-view treatment for regenerate so the user
        // sees the updated Blueprint instead of having to hunt for it.
        shouldScrollToBlueprint.current = true;
        const updated = normalizeBrief(data.brief);
        setBrief(updated);
        // Re-fetch the starter prompt - server invalidated it on
        // regenerate so a fresh one will be generated.
        setStarterPrompt(null);
        fetchStarterPrompt();

        onBriefChanged?.(updated);
      } else {
        const data = await res.json().catch(() => ({}));
        setBriefError(
          data?.error ??
            "We couldn't update your Blueprint right now. Please try again."
        );
      }
    } catch {
      setBriefError(
        "We couldn't update your Blueprint right now. Please try again."
      );
    } finally {
      setBriefUpdating(false);
    }
  }

  async function fetchStarterPrompt() {
    setStarterPromptError(null);
    try {
      const res = await fetch("/api/planning/starter-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningSessionId: session.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setStarterPrompt(data.starterPrompt);
        return;
      }
      // Non-OK response - surface a retry instead of silently leaving the
      // panel in a "preparing" state forever.
      const data = await res.json().catch(() => ({}));
      setStarterPromptError(
        data?.error ??
          "We couldn't prepare your Starter Prompt. Try again?"
      );
    } catch {
      setStarterPromptError(
        "We couldn't prepare your Starter Prompt. Try again?"
      );
    }
  }

  // If we landed on /plan with an already-completed session (existing
  // brief), eagerly populate the Starter Prompt the same way we do
  // right after generating one.
  useEffect(() => {
    if (isPostPrd && !starterPrompt) {
      fetchStarterPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPostPrd]);

  function handleCopyBlueprint() {
    if (!brief?.prdMarkdown) return;
    navigator.clipboard.writeText(brief.prdMarkdown);
  }

  function handleDownloadPrd() {
    if (!brief?.prdMarkdown) return;
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

  function handleSaveAsPdf() {
    if (!brief?.prdMarkdown) return;
    // We use window.print() under the hood - modern browsers expose a
    // "Save as PDF" destination in the print dialog, which is the right
    // mental model for the user. The print stylesheet (globals.css)
    // hides everything outside .print-blueprint-area when
    // html.printing-blueprint is set, so the resulting PDF is a clean
    // document export with no chrome.
    document.documentElement.classList.add("printing-blueprint");
    const cleanup = () => {
      document.documentElement.classList.remove("printing-blueprint");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  // Split the conversation around the Blueprint snapshot point so the
  // pre-Blueprint thread renders above the Blueprint card (as the chat
  // that produced it) and any post-Blueprint refinement renders directly
  // adjacent to the input below. The full history stays unified
  // server-side; this is purely a render-time split.
  const preBlueprintAll =
    briefSnapshotLength !== null
      ? session.conversationHistory.slice(0, briefSnapshotLength)
      : session.conversationHistory;
  const postBlueprintAll =
    briefSnapshotLength !== null
      ? session.conversationHistory.slice(briefSnapshotLength)
      : [];

  const preBlueprintVisible = preBlueprintAll.filter(
    (m) => m.role !== "system"
  );
  const postBlueprintVisible = postBlueprintAll.filter(
    (m) => m.role !== "system"
  );

  const hasUserTurn = session.conversationHistory.some(
    (m) => m.role === "user"
  );

  // While a brief is being updated, route stream/error UI into the
  // post-Blueprint section. Pre-Blueprint section keeps its UIs when we
  // haven't shipped a Blueprint yet.
  const streamAndErrorPanel = (
    <>
      {isStreaming && streamingText && (
        <AIMessage content={streamingText} isStreaming />
      )}

      {/* Inline error card with Retry - replaces the silent empty-bubble
          failure mode that used to appear when a model call failed. */}
      {streamError && !isStreaming && (
        <div
          className="py-4 px-4 rounded-sm"
          style={{
            backgroundColor: "var(--surface-muted, #fafafa)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="font-serif text-[15px] leading-relaxed mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            {streamError.message}
          </p>
          <button
            type="button"
            onClick={() => streamError.retry()}
            className="mono-label transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            ↻ Retry
          </button>
        </div>
      )}

      {/* Blueprint generation/update error - surfaced inline so the
          participant isn't left wondering after they hit Generate or
          Update. */}
      {briefError && (
        <div
          className="py-4 px-4 rounded-sm"
          style={{
            backgroundColor: "var(--surface-muted, #fafafa)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="font-serif text-[15px] leading-relaxed mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            {briefError}
          </p>
          <button
            type="button"
            onClick={() => (brief ? handleUpdatePrd() : generateBrief())}
            className="mono-label transition-colors hover:text-[var(--text-primary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            ↻ Retry
          </button>
        </div>
      )}
    </>
  );

  // Focused refinement entry: the dialog opens straight to the refine
  // input without re-rendering the original chat that produced the
  // current Blueprint or the inline Blueprint/Starter Prompt block -
  // both have already been seen via the Section 02 action buttons.
  const isRefineFocus = focusMode === "refine" && isPostPrd;

  return (
    <div className="max-w-[var(--container-narrow)] mx-auto">
      {/* Pre-Blueprint conversation - the chat that produced (or is
          producing) the current Blueprint. Once a Blueprint exists,
          this section becomes a record; new turns land below. */}
      <div className="space-y-4 mb-6">
        {!isRefineFocus &&
          preBlueprintVisible.map((msg, i) => (
            <MessageBubble key={`pre-${i}`} message={msg} />
          ))}

        {/* Streaming + error UIs live here only while we're still in the
            pre-Blueprint flow. Once isPostPrd is true they move into the
            refinement section below. */}
        {!isPostPrd && streamAndErrorPanel}

        {briefGenerating && (
          <div className="text-center py-8">
            <div
              className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--border-default)",
                borderTopColor: "var(--text-primary)",
              }}
            />
            <p className="mt-4 mono-label">Generating your Blueprint…</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Blueprint + Next Steps - rendered right after the conversation
          so the artifact appears at the participant's eye-line when
          they click Generate. Smooth-scroll into view on first
          generation. Hidden in refine-focus mode because the
          participant has already seen these via Section 02's View
          Blueprint / View Starter Prompt buttons. */}
      {isPostPrd && brief && !isRefineFocus && (
        <div
          ref={blueprintRef}
          className="space-y-6 mb-10 print-blueprint-area"
        >
          <ProjectBriefCard
            brief={brief}
            onCopyBlueprint={handleCopyBlueprint}
            onDownloadPrd={handleDownloadPrd}
            onSaveAsPdf={handleSaveAsPdf}
            updating={briefUpdating}
          />
          <StarterPrompt
            prompt={starterPrompt}
            error={starterPromptError}
            onRetry={fetchStarterPrompt}
            buildTool={session.buildTool}
          />
        </div>
      )}

      {/* Pre-Blueprint input area: textarea + Send + persistent CTA */}
      {!briefGenerating && !isPostPrd && (
        <div className="space-y-4">
          <UserInput onSend={handleSend} disabled={isStreaming} />
          <GenerateCTA
            ready={isReadyToGenerate}
            disabled={isStreaming || !hasUserTurn}
            onClick={generateBrief}
          />
        </div>
      )}

      {/* Post-Blueprint refinement section - section header, live
          continuation thread, input, and smart Update CTA. The
          continuation thread sits directly above the input so the AI's
          reply lands at the user's eye-line. */}
      {!briefGenerating && isPostPrd && (
        <div className="space-y-4 print:hidden">
          <div
            className="mb-2 pb-3"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            <span className="mono-label">Refining your Blueprint</span>
            <p
              className="font-serif text-sm italic mt-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Keep talking it through. When the changes feel right, hit
              Update my Blueprint and I&rsquo;ll roll them in.
            </p>
          </div>

          {postBlueprintVisible.length === 0 &&
          !isStreaming &&
          !streamError &&
          !briefError ? (
            isRefineFocus ? (
              <AIMessage
                content={
                  "What about your Blueprint would you like to refine? Tell me what's off, what to add, or what to rethink - I'll roll the changes in."
                }
              />
            ) : (
              <p
                className="font-serif italic text-[15px] py-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Anything you want to refine? Talk it through below and
                I&rsquo;ll roll your changes in.
              </p>
            )
          ) : (
            <div className="space-y-4">
              {postBlueprintVisible.map((msg, i) => (
                <MessageBubble key={`post-${i}`} message={msg} />
              ))}
              {streamAndErrorPanel}
            </div>
          )}

          <div ref={postMessagesEndRef} />

          <PostPrdInput
            onSend={handleSend}
            disabled={isStreaming || briefUpdating}
          />

          <UpdateCTA
            ready={isReadyToUpdate}
            disabled={
              isStreaming || briefUpdating || !hasPostPrdMessages
            }
            updating={!!briefUpdating}
            onClick={handleUpdatePrd}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Single message bubble - extracted so the pre- and post-Blueprint
 * threads render identical styling without duplicated markup.
 */
function MessageBubble({ message }: { message: Message }) {
  if (message.role === "assistant") {
    return <AIMessage content={message.content} />;
  }
  return (
    <div
      className="font-sans text-[15px] leading-relaxed py-3 px-4 rounded-sm"
      style={{
        backgroundColor: "var(--white)",
        border: "1px solid var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      {message.content}
    </div>
  );
}

/**
 * Persistent "Generate my Blueprint" CTA. Default state is secondary
 * (subtle, helper text says "when you're ready"). When the AI's most
 * recent message contains a ready-signal phrase, it upgrades to a
 * primary styling and the helper text changes - so the AI's voice and
 * the UI feel like a single product.
 */
function GenerateCTA({
  ready,
  disabled,
  onClick,
}: {
  ready: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3 px-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
        style={{
          color: ready ? "var(--white)" : "var(--text-secondary)",
          backgroundColor: ready ? "var(--text-primary)" : "transparent",
          border: ready
            ? "1px solid var(--text-primary)"
            : "1px solid var(--border-default)",
        }}
      >
        ◆ Generate my Blueprint →
      </button>
      <p
        className="font-serif text-xs italic text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {ready
          ? "You're ready - let's go."
          : "Generate when you're ready. The longer you talk, the better it gets."}
      </p>
    </div>
  );
}

/**
 * The post-Blueprint counterpart to GenerateCTA. Default state is a
 * quiet bordered button that's disabled until at least one post-Blueprint
 * exchange has happened. When the AI signals it has captured the changes
 * (POST_PRD_READY_PHRASES), the button upgrades to the same grayscale
 * primary fill (dark background + white text) as GenerateCTA so the
 * visual cue matches the AI's voice without breaking the grayscale
 * design language. While updating, the label and helper text reflect
 * progress.
 */
function UpdateCTA({
  ready,
  disabled,
  updating,
  onClick,
}: {
  ready: boolean;
  disabled: boolean;
  updating: boolean;
  onClick: () => void;
}) {
  const label = updating
    ? "Updating your Blueprint…"
    : "◆ Update my Blueprint →";

  const helper = updating
    ? "Rolling your changes into the Blueprint now."
    : ready
      ? "Ready to roll those in."
      : "Hit Update when these changes feel right.";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3 px-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
        style={{
          color:
            ready && !updating ? "var(--white)" : "var(--text-secondary)",
          backgroundColor:
            ready && !updating ? "var(--text-primary)" : "transparent",
          border:
            ready && !updating
              ? "1px solid var(--text-primary)"
              : "1px solid var(--border-default)",
        }}
      >
        {label}
      </button>
      <p
        className="font-serif text-xs italic text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {helper}
      </p>
    </div>
  );
}

/**
 * The brief API returns snake_case from Supabase.
 * Normalize to the camelCase ProjectBrief interface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBrief(raw: any): ProjectBrief {
  return {
    id: raw.id,
    eventId: raw.event_id ?? raw.eventId ?? null,
    userId: raw.user_id ?? raw.userId,
    ideaId: raw.idea_id ?? raw.ideaId ?? null,
    planningSessionId: raw.planning_session_id ?? raw.planningSessionId,
    projectName: raw.project_name ?? raw.projectName,
    oneSentenceScope: raw.one_sentence_scope ?? raw.oneSentenceScope,
    targetUser: raw.target_user ?? raw.targetUser,
    coreFeature: raw.core_feature ?? raw.coreFeature,
    designVibe: raw.design_vibe ?? raw.designVibe ?? null,
    referenceUrl: raw.reference_url ?? raw.referenceUrl ?? null,
    colorToneNotes: raw.color_tone_notes ?? raw.colorToneNotes ?? null,
    outOfScope: raw.out_of_scope ?? raw.outOfScope,
    doneLooksLike: raw.done_looks_like ?? raw.doneLooksLike,
    prdMarkdown: raw.prd_markdown ?? raw.prdMarkdown ?? null,
    version: raw.version ?? 1,
    isCurrent: raw.is_current ?? raw.isCurrent ?? true,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
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
