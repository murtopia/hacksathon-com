"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./step-indicator";
import { AIMessage } from "./ai-message";
import { UserInput } from "./user-input";
import { ProjectBriefCard } from "./project-brief-card";
import { BuildNotesPanel } from "./build-notes-panel";
import { StarterPrompt } from "./starter-prompt";
import type {
  PlanningSession,
  Message,
  ProjectBrief,
  BuildNotes,
} from "@/lib/planning/types";
import { isLastStep, getStep } from "@/lib/planning/steps";

interface PlanningFlowProps {
  session: PlanningSession;
}

export function PlanningFlow({ session: initialSession }: PlanningFlowProps) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [buildNotes, setBuildNotes] = useState<BuildNotes | null>(null);
  const [buildNotesLoading, setBuildNotesLoading] = useState(false);
  const [starterPrompt, setStarterPrompt] = useState<string | null>(null);
  const [starterPromptLoading, setStarterPromptLoading] = useState(false);
  const [phase, setPhase] = useState<"conversation" | "complete">(
    session.status === "complete" ? "complete" : "conversation"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Open the first step on mount if the conversation is empty
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
        setIsStreaming(false);
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

      // After streaming completes, add the assistant message to local state
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
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSend(message: string) {
    // Optimistically add the user message to the conversation
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
      // Generate the brief
      await callStepAPI("advance");
      await generateBrief();
    } else {
      await callStepAPI("advance");
    }
  }

  async function generateBrief() {
    setPhase("complete");

    try {
      const res = await fetch("/api/planning/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planningSessionId: session.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setBrief(data.brief);
        setSession((prev) => ({
          ...prev,
          status: "complete",
          briefId: data.brief.id,
        }));

        // Fire build notes generation in the background
        generateBuildNotes(data.brief.id);
      }
    } catch {
      // Brief generation failed — the user can retry
    }
  }

  async function generateBuildNotes(briefId: string) {
    setBuildNotesLoading(true);
    try {
      const res = await fetch("/api/planning/build-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningSessionId: session.id,
          projectBriefId: briefId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.buildNotes) {
          setBuildNotes(data.buildNotes);
        }
      }
    } finally {
      setBuildNotesLoading(false);
    }
  }

  function handleRevise() {
    if (!brief) return;
    const url = new URL("/plan", window.location.origin);
    url.searchParams.set("revise", brief.id);
    if (session.eventId) url.searchParams.set("event", session.eventId);
    if (session.ideaId) url.searchParams.set("idea", session.ideaId);
    url.searchParams.set("tool", session.buildTool);
    router.push(url.toString());
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

  // Check if the user has answered the current step at least once
  const hasAnsweredCurrentStep = session.conversationHistory.some(
    (m) =>
      m.role === "user" &&
      m.stepNumber === session.currentStep &&
      m.messageType === "user_response"
  );

  // Filter visible messages (exclude system-role advance notes)
  const visibleMessages = session.conversationHistory.filter(
    (m) => m.role !== "system"
  );

  const currentStepDef = getStep(session.currentStep);

  return (
    <div className="max-w-[var(--container-narrow)] mx-auto">
      {/* Step indicator */}
      {phase === "conversation" && (
        <div className="mb-6">
          <StepIndicator currentStep={session.currentStep} />
        </div>
      )}

      {/* Coaching tip */}
      {phase === "conversation" && currentStepDef && (
        <p
          className="font-serif text-sm italic mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {currentStepDef.coachingTip}
        </p>
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

        {/* Streaming AI message */}
        {isStreaming && streamingText && (
          <AIMessage content={streamingText} isStreaming />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* User input area */}
      {phase === "conversation" && (
        <UserInput
          currentStep={session.currentStep}
          onSend={handleSend}
          onAdvance={handleAdvance}
          disabled={isStreaming}
          hasAnsweredCurrentStep={hasAnsweredCurrentStep}
        />
      )}

      {/* Post-conversation outputs */}
      {phase === "complete" && (
        <div className="space-y-6">
          {brief ? (
            <>
              <ProjectBriefCard
                brief={normalizeBrief(brief)}
                onCopyStarterPrompt={handleCopyStarterPrompt}
                starterPromptLoading={starterPromptLoading}
                onRevise={handleRevise}
              />

              {starterPrompt && <StarterPrompt prompt={starterPrompt} />}

              <BuildNotesPanel
                buildNotes={buildNotes}
                loading={buildNotesLoading}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div
                className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--border-default)",
                  borderTopColor: "var(--text-primary)",
                }}
              />
              <p
                className="mt-4 mono-label"
              >
                Generating your Project Brief...
              </p>
            </div>
          )}
        </div>
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
    version: raw.version ?? 1,
    isCurrent: raw.is_current ?? raw.isCurrent ?? true,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}
