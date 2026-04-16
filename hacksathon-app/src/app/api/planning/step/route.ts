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
} from "@/lib/planning/prompts";
import type { Message } from "@/lib/planning/types";
import { getStep, isLastStep } from "@/lib/planning/steps";

export const maxDuration = 60;

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
    action?: "open_step" | "respond" | "advance";
  } = body;

  // Load session
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

  // Load participant context
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

  const systemPrompt = buildSystemPrompt(participantCtx);
  let history = session.conversationHistory;
  let currentStep = session.currentStep;
  let stepAnswers = session.stepAnswers;

  // Handle advance action: user moves to the next step
  if (action === "advance") {
    const advanceNote: Message = {
      role: "system",
      content: buildAdvanceNote(currentStep),
      stepNumber: currentStep,
      messageType: "advance",
    };
    history = appendMessage(history, advanceNote);
    currentStep = Math.min(currentStep + 1, 5);

    await supabase
      .from("planning_sessions")
      .update({
        conversation_history: history,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  // Handle user response: append their message to history
  if (action === "respond" && userMessage) {
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      stepNumber: currentStep,
      messageType: "user_response",
    };
    history = appendMessage(history, userMsg);

    stepAnswers = updateStepAnswer(stepAnswers, currentStep, userMessage);

    await supabase
      .from("planning_sessions")
      .update({
        conversation_history: history,
        step_answers: stepAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
  }

  // Build the step instruction for the AI
  const step = getStep(currentStep);
  const stepInstruction =
    action === "open_step" || action === "advance"
      ? buildStepInstruction(currentStep)
      : "";

  const fullSystem = stepInstruction
    ? `${systemPrompt}\n\n---\n\n${stepInstruction}`
    : systemPrompt;

  // For step openings, if this is step 1 with no history, seed the
  // opening question as context so the AI knows what to ask.
  const aiMessages = toAIMessages(history);
  if (
    (action === "open_step" || action === "advance") &&
    step &&
    !step.aiGeneratedOpening &&
    aiMessages.length === 0
  ) {
    // Step 1 with no conversation yet: let the AI generate a natural opening
  }

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
    },
  });
}
