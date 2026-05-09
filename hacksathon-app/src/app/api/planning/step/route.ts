import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  rowToSession,
  appendMessage,
  updateStepAnswer,
  toAIMessages,
  buildParticipantContext,
} from "@/lib/planning/context";
import {
  buildSystemPrompt,
  buildStepInstruction,
  buildAdvanceNote,
  buildPostPrdPrompt,
} from "@/lib/planning/prompts";
import type { Message } from "@/lib/planning/types";
import { getStep, isLastStep, TOTAL_STEPS } from "@/lib/planning/steps";

export const maxDuration = 60;

type StepAction = "open_step" | "respond" | "advance";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const {
    planningSessionId,
    userMessage,
    action,
  }: {
    planningSessionId: string;
    userMessage?: string;
    action?: StepAction;
  } = body;

  const { data: sessionRow, error: sessionError } = await supabase
    .from("planning_sessions")
    .select("*")
    .eq("id", planningSessionId)
    .single();

  if (sessionError || !sessionRow) {
    return new Response("Session not found", { status: 404 });
  }

  const session = rowToSession(sessionRow);

  if (session.userId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  // Participant context
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  let ideaName: string | null = null;
  let ideaPitch: string | null = null;
  if (session.ideaId) {
    const { data: idea } = await supabase
      .from("ideas")
      .select("title, pitch")
      .eq("id", session.ideaId)
      .single();
    if (idea) {
      ideaName = idea.title;
      ideaPitch = idea.pitch;
    }
  }

  let eventName: string | null = null;
  if (session.eventId) {
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", session.eventId)
      .single();
    if (event) {
      eventName = event.title;
    }
  }

  const participantCtx = buildParticipantContext({
    profileName: profile?.full_name,
    ideaName,
    ideaPitch,
    buildTool: session.buildTool,
    eventName,
  });

  let systemPrompt = buildSystemPrompt(participantCtx);

  // Post-PRD continuation: if a brief already exists, load it and inject
  // the existing PRD as context. The conversation stays open — same session,
  // same history — but the AI now treats the PRD as the source of truth.
  const isPostPrd = session.status === "complete" && session.briefId;
  if (isPostPrd) {
    const { data: existingBrief } = await supabase
      .from("project_briefs")
      .select("prd_markdown, project_name")
      .eq("id", session.briefId!)
      .single();

    if (existingBrief?.prd_markdown) {
      systemPrompt += "\n\n" + buildPostPrdPrompt(existingBrief.prd_markdown);
    }
  }

  let history = session.conversationHistory;
  let currentStep = session.currentStep;
  let stepAnswers = session.stepAnswers;

  // advance: user moves to the next step (only meaningful pre-PRD)
  if (action === "advance" && !isPostPrd) {
    const advanceNote: Message = {
      role: "system",
      content: buildAdvanceNote(currentStep),
      stepNumber: currentStep,
      messageType: "advance",
    };
    history = appendMessage(history, advanceNote);
    currentStep = Math.min(currentStep + 1, TOTAL_STEPS);

    await supabase
      .from("planning_sessions")
      .update({
        conversation_history: history,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  // respond: append the user's message to the conversation
  if (action === "respond" && userMessage) {
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      stepNumber: currentStep,
      messageType: "user_response",
    };
    history = appendMessage(history, userMsg);

    // Track step answers only during the structured 5-step phase
    if (!isPostPrd) {
      stepAnswers = updateStepAnswer(stepAnswers, currentStep, userMessage);
    }

    await supabase
      .from("planning_sessions")
      .update({
        conversation_history: history,
        step_answers: stepAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  // Build per-step instruction (only when opening a step pre-PRD)
  const step = getStep(currentStep);
  const shouldUseStepInstruction =
    !isPostPrd &&
    (action === "open_step" || action === "advance") &&
    !!step;

  const fullSystem = shouldUseStepInstruction
    ? `${systemPrompt}\n\n---\n\n${buildStepInstruction(currentStep)}`
    : systemPrompt;

  const aiMessages = toAIMessages(history);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6-20250514"),
    system: fullSystem,
    messages:
      aiMessages.length > 0
        ? aiMessages
        : [{ role: "user", content: "[Start the planning session]" }],
    onFinish: async ({ text }) => {
      const assistantMsg: Message = {
        role: "assistant",
        content: text,
        stepNumber: currentStep,
        messageType:
          action === "open_step" || action === "advance"
            ? "question"
            : "reflection",
      };

      const updatedHistory = appendMessage(history, assistantMsg);

      await supabase
        .from("planning_sessions")
        .update({
          conversation_history: updatedHistory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    },
  });

  const lastStep = isLastStep(currentStep);

  return result.toTextStreamResponse({
    headers: {
      "X-Planning-Step": String(currentStep),
      "X-Planning-Is-Last-Step": String(lastStep),
      "X-Planning-Post-Prd": String(isPostPrd),
    },
  });
}
