import type {
  Message,
  PlanningSession,
  StepAnswers,
  ParticipantContext,
  PlanningMode,
} from "./types";
import { EMPTY_STEP_ANSWERS } from "./types";

/**
 * Map a Supabase row (snake_case) to a PlanningSession (camelCase).
 */
export function rowToSession(row: Record<string, unknown>): PlanningSession {
  return {
    id: row.id as string,
    eventId: (row.event_id as string) ?? null,
    userId: row.user_id as string,
    ideaId: (row.idea_id as string) ?? null,
    buildTool: row.build_tool as string,
    mode: row.mode as PlanningMode,
    existingBriefId: (row.existing_brief_id as string) ?? null,
    currentStep: row.current_step as number,
    stepAnswers: row.step_answers as StepAnswers,
    conversationHistory: row.conversation_history as Message[],
    status: row.status as PlanningSession["status"],
    briefId: (row.brief_id as string) ?? null,
    buildNotesId: (row.build_notes_id as string) ?? null,
    starterPromptText: (row.starter_prompt_text as string) ?? null,
    starterPromptCopiedAt: (row.starter_prompt_copied_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Build the initial insert payload for a new planning session (snake_case for Supabase).
 */
export function buildNewSessionRow(params: {
  userId: string;
  eventId?: string | null;
  ideaId?: string | null;
  buildTool?: string;
  mode?: PlanningMode;
  existingBriefId?: string | null;
}) {
  return {
    user_id: params.userId,
    event_id: params.eventId ?? null,
    idea_id: params.ideaId ?? null,
    build_tool: params.buildTool ?? "lovable",
    mode: params.mode ?? "create",
    existing_brief_id: params.existingBriefId ?? null,
    current_step: 1,
    step_answers: EMPTY_STEP_ANSWERS,
    conversation_history: [] as Message[],
    status: "in_progress",
  };
}

/**
 * Append a message to the conversation history and return the updated array.
 */
export function appendMessage(
  history: Message[],
  message: Message
): Message[] {
  return [...history, message];
}

/**
 * Update a specific step answer. Returns a new StepAnswers object.
 */
export function updateStepAnswer(
  answers: StepAnswers,
  stepNumber: number,
  value: string
): StepAnswers {
  const updated = { ...answers };
  switch (stepNumber) {
    case 1:
      updated.step1 = value;
      break;
    case 2:
      updated.step2 = value;
      break;
    case 3:
      updated.step3 = { ...updated.step3, vibe: value };
      break;
    case 4:
      updated.step4 = value;
      break;
    case 5:
      updated.step5 = value;
      break;
  }
  return updated;
}

/**
 * Convert conversation history to the format expected by the Vercel AI SDK.
 * Filters out system-role messages (those go in the system prompt)
 * and maps our Message type to CoreMessage.
 */
export function toAIMessages(
  history: Message[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

/**
 * Build participant context from available data.
 */
export function buildParticipantContext(params: {
  profileName?: string | null;
  ideaName?: string | null;
  ideaPitch?: string | null;
  buildTool: string;
  eventName?: string | null;
}): ParticipantContext {
  return {
    participantName: params.profileName ?? null,
    ideaName: params.ideaName ?? null,
    ideaPitch: params.ideaPitch ?? null,
    buildTool: params.buildTool,
    eventName: params.eventName ?? null,
  };
}
