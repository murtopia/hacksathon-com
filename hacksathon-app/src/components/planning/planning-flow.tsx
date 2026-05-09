"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { StepIndicator } from "./step-indicator";
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
import { isLastStep, getStep } from "@/lib/planning/steps";

interface PlanningFlowProps {
  session: PlanningSession;
  initialBrief?: ProjectBrief | null;
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
  const [starterPromptLoading, setStarterPromptLoading] = useState(false);
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
   * brief was generated/updated. Used to detect post-PRD continuation:
   * the conversation has new messages worth committing to a PRD update.
   */
  const [briefSnapshotLength, setBriefSnapshotLength] = useState<number | null>(
    initialBrief ? initialSession.conversationHistory.length : null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

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

  // Step 1's opening is seeded server-side at session creation
  // (deterministic Scenario A/B from the planning doc). We only fall
  // back to an AI open_step call here for legacy sessions that were
  // created before that change and somehow have an empty history.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (
      session.conversationHistory.length === 0 &&
      session.status === "in_progress"
    ) {
      callStepAPI("open_step");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [session.conversationHistory, streamingText, scrollToBottom]);

  async function callStepAPI(
    action: "open_step" | "respond" | "advance",
    userMessage?: string
  ) {
    setIsStreaming(true);
    setStreamingText("");
    setStreamError(null);

    // The server has different idempotency for each action: "respond"
    // appends the user message and "advance" increments the step. If
    // the model call fails after those side effects commit, retrying
    // with the same action would double-write. Map both to safe
    // retry actions that re-stream from existing history without
    // mutating it again.
    const buildRetry = () => async () => {
      if (action === "advance") return callStepAPI("open_step");
      if (action === "respond") return callStepAPI("respond"); // no userMessage = no re-append
      return callStepAPI(action);
    };

    const failWith = (message: string) => {
      setStreamError({ message, retry: buildRetry() });
      setStreamingText("");
      setIsStreaming(false);
    };

    try {
      const res = await fetch("/api/planning/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningSessionId: session.id,
          action,
          userMessage,
        }),
      });

      if (!res.ok || !res.body) {
        failWith(
          "Something went wrong reaching the planning model. Try again?"
        );
        return;
      }

      const newStep = parseInt(res.headers.get("X-Planning-Step") ?? "0");
      if (newStep > 0 && newStep !== session.currentStep) {
        setSession((prev) => ({ ...prev, currentStep: newStep }));
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
        stepNumber: newStep || session.currentStep,
        messageType: action === "respond" ? "reflection" : "question",
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
      stepNumber: session.currentStep,
      messageType: "user_response",
    };

    setSession((prev) => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, userMsg],
    }));

    callStepAPI("respond", message);
  }

  async function handleAdvance() {
    if (isLastStep(session.currentStep)) {
      await callStepAPI("advance");
      await generateBrief();
    } else {
      await callStepAPI("advance");
    }
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
      } else {
        const data = await res.json().catch(() => ({}));
        setBriefError(
          data?.error ??
            "We couldn't generate your PRD right now. Please try again."
        );
      }
    } catch {
      setBriefError(
        "We couldn't generate your PRD right now. Please try again."
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
        setStarterPrompt(null);
        // Snapshot is reset in the brief-watching useEffect.
      } else {
        const data = await res.json().catch(() => ({}));
        setBriefError(
          data?.error ??
            "We couldn't update your PRD right now. Please try again."
        );
      }
    } catch {
      setBriefError(
        "We couldn't update your PRD right now. Please try again."
      );
    } finally {
      setBriefUpdating(false);
    }
  }

  async function handleCopyStarterPrompt() {
    if (starterPrompt) {
      await navigator.clipboard.writeText(starterPrompt);
      return;
    }

    setStarterPromptLoading(true);
    try {
      const res = await fetch("/api/planning/starter-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningSessionId: session.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setStarterPrompt(data.starterPrompt);
        await navigator.clipboard.writeText(data.starterPrompt);
      }
    } finally {
      setStarterPromptLoading(false);
    }
  }

  function handleDownloadPrd() {
    if (!brief?.prdMarkdown) return;
    const blob = new Blob([brief.prdMarkdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugifyForFilename(brief.projectName)}-PRD.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasAnsweredCurrentStep = session.conversationHistory.some(
    (m) =>
      m.role === "user" &&
      m.stepNumber === session.currentStep &&
      m.messageType === "user_response"
  );

  // Filter visible messages (exclude internal system notes)
  const visibleMessages = session.conversationHistory.filter(
    (m) => m.role !== "system"
  );

  const currentStepDef = getStep(session.currentStep);

  return (
    <div className="max-w-[var(--container-narrow)] mx-auto">
      {/* Step indicator (pre-PRD only) */}
      {!isPostPrd && (
        <div className="mb-6">
          <StepIndicator currentStep={session.currentStep} />
        </div>
      )}

      {/* Coaching tip (pre-PRD only) */}
      {!isPostPrd && currentStepDef && (
        <p
          className="font-serif text-sm italic mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {currentStepDef.coachingTip}
        </p>
      )}

      {/* PRD + Starter Prompt — shown above the conversation post-PRD */}
      {isPostPrd && brief && (
        <div className="space-y-6 mb-10">
          <ProjectBriefCard
            brief={brief}
            onCopyStarterPrompt={handleCopyStarterPrompt}
            onDownloadPrd={handleDownloadPrd}
            starterPromptLoading={starterPromptLoading}
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

        {/* PRD generation/update error — surfaced inline so the
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

        {/* Generating PRD spinner — appears between conversation and input */}
        {briefGenerating && (
          <div className="text-center py-8">
            <div
              className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--border-default)",
                borderTopColor: "var(--text-primary)",
              }}
            />
            <p className="mt-4 mono-label">Generating your PRD…</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pre-PRD input area */}
      {!briefGenerating && !isPostPrd && (
        <UserInput
          currentStep={session.currentStep}
          onSend={handleSend}
          onAdvance={handleAdvance}
          disabled={isStreaming}
          hasAnsweredCurrentStep={hasAnsweredCurrentStep}
        />
      )}

      {/* Post-PRD input area — conversation stays open */}
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
