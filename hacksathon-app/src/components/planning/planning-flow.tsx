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
}

/**
 * Heuristic for detecting when the AI has signaled the conversation has
 * enough material to generate the Blueprint. Strike Mission's session
 * ended with "That's everything I need. Ready to turn this into a build
 * plan?" — exactly the kind of phrasing this matches. Purely visual: when
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

function isReadySignal(text: string): boolean {
  return READY_PHRASES.some((re) => re.test(text));
}

export function PlanningFlow({
  session: initialSession,
  initialBrief = null,
}: PlanningFlowProps) {
  const [session, setSession] = useState(initialSession);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [brief, setBrief] = useState<ProjectBrief | null>(initialBrief);
  const [briefGenerating, setBriefGenerating] = useState(false);
  const [briefUpdating, setBriefUpdating] = useState(false);
  const [starterPrompt, setStarterPrompt] = useState<string | null>(null);
  /**
   * Tracks the most recent stream failure so we can show an inline error
   * card with a Retry affordance — instead of the silent empty-bubble
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief?.id, brief?.updatedAt]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
        setBrief(normalizeBrief(data.brief));
        // Re-fetch the starter prompt — server invalidated it on
        // regenerate so a fresh one will be generated.
        setStarterPrompt(null);
        fetchStarterPrompt();
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
    try {
      const res = await fetch("/api/planning/starter-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningSessionId: session.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setStarterPrompt(data.starterPrompt);
      }
    } catch {
      // Non-critical — the StarterPrompt panel will show its own
      // empty state and the Copy button will retry on click.
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

  async function handleCopyStarterPrompt() {
    if (!starterPrompt) return;
    await navigator.clipboard.writeText(starterPrompt);
  }

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

  function handlePrintBlueprint() {
    if (!brief?.prdMarkdown) return;
    // The print stylesheet (in globals.css) hides everything outside
    // .print-blueprint-area when html.printing-blueprint is set, so the
    // browser's print dialog produces a clean Blueprint-only PDF.
    document.documentElement.classList.add("printing-blueprint");
    const cleanup = () => {
      document.documentElement.classList.remove("printing-blueprint");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  // Filter visible messages (exclude internal system notes)
  const visibleMessages = session.conversationHistory.filter(
    (m) => m.role !== "system"
  );

  const hasUserTurn = session.conversationHistory.some(
    (m) => m.role === "user"
  );

  return (
    <div className="max-w-[var(--container-narrow)] mx-auto">
      {/* Blueprint + Starter Prompt — shown above the conversation post-Blueprint */}
      {isPostPrd && brief && (
        <div className="space-y-6 mb-10 print-blueprint-area">
          <ProjectBriefCard
            brief={brief}
            onCopyBlueprint={handleCopyBlueprint}
            onCopyStarterPrompt={handleCopyStarterPrompt}
            onDownloadPrd={handleDownloadPrd}
            onPrintBlueprint={handlePrintBlueprint}
            starterPromptReady={!!starterPrompt}
            updating={briefUpdating}
          />
          <StarterPrompt prompt={starterPrompt} />
        </div>
      )}

      {/* Conversation messages */}
      <div className="space-y-4 mb-6">
        {visibleMessages.map((msg, i) => (
          <div key={i}>
            {msg.role === "assistant" ? (
              <AIMessage content={msg.content} />
            ) : (
              <div
                className="font-sans text-[15px] leading-relaxed py-3 px-4 rounded-sm"
                style={{
                  backgroundColor: "var(--white)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {isStreaming && streamingText && (
          <AIMessage content={streamingText} isStreaming />
        )}

        {/* Inline error card with Retry — replaces the silent empty-bubble
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

        {/* Blueprint generation/update error — surfaced inline so the
            participant isn't left wondering after they hit "Generate". */}
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

        {/* Generating Blueprint spinner — appears between conversation and input */}
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

      {/* Post-Blueprint input area — conversation stays open */}
      {!briefGenerating && isPostPrd && (
        <PostPrdInput
          onSend={handleSend}
          onUpdatePrd={handleUpdatePrd}
          disabled={isStreaming || briefUpdating}
          updating={briefUpdating}
          showUpdateButton={hasPostPrdMessages}
        />
      )}
    </div>
  );
}

/**
 * Persistent "Generate my Blueprint" CTA. Default state is secondary
 * (subtle, helper text says "when you're ready"). When the AI's most
 * recent message contains a ready-signal phrase, it upgrades to a
 * primary styling and the helper text changes — so the AI's voice and
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
        className={
          ready
            ? "gradient-border w-full py-3 px-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
            : "w-full py-3 px-4 rounded-sm font-mono text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
        }
        style={{
          color: ready ? "var(--text-primary)" : "var(--text-secondary)",
          backgroundColor: ready ? undefined : "transparent",
          border: ready ? undefined : "1px solid var(--border-default)",
        }}
      >
        ◆ Generate my Blueprint →
      </button>
      <p
        className="font-serif text-xs italic text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {ready
          ? "You're ready — let's go."
          : "Generate when you're ready. The longer you talk, the better it gets."}
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
