export interface Message {
  role: "system" | "assistant" | "user";
  content: string;
  stepNumber?: number;
  messageType?:
    | "question"
    | "reflection"
    | "followup"
    | "advance"
    | "user_response";
}

export interface StepAnswers {
  step1: string | null;
  step2: string | null;
  step3: {
    vibe: string | null;
    referenceUrl: string | null;
    colorNotes: string | null;
  };
  step4: string | null;
  step5: string | null;
}

export const EMPTY_STEP_ANSWERS: StepAnswers = {
  step1: null,
  step2: null,
  step3: { vibe: null, referenceUrl: null, colorNotes: null },
  step4: null,
  step5: null,
};

export type PlanningMode = "create" | "revise";
export type SessionStatus = "in_progress" | "complete" | "abandoned";

export interface PlanningSession {
  id: string;
  eventId: string | null;
  userId: string;
  ideaId: string | null;
  buildTool: string;
  mode: PlanningMode;
  existingBriefId: string | null;
  currentStep: number;
  stepAnswers: StepAnswers;
  conversationHistory: Message[];
  status: SessionStatus;
  briefId: string | null;
  buildNotesId: string | null;
  starterPromptText: string | null;
  starterPromptCopiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBrief {
  id: string;
  eventId: string | null;
  userId: string;
  ideaId: string | null;
  planningSessionId: string;
  projectName: string;
  oneSentenceScope: string;
  targetUser: string;
  coreFeature: string;
  designVibe: string | null;
  referenceUrl: string | null;
  colorToneNotes: string | null;
  outOfScope: string;
  doneLooksLike: string;
  version: number;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuildNotes {
  id: string;
  planningSessionId: string;
  projectBriefId: string;
  userId: string;
  tensions: string[];
  considerations: string[];
  assumptions: string[];
  v1ScopeSuggestion: string | null;
  createdAt: string;
}

/**
 * Participant context injected into the system prompt.
 * Available fields depend on whether this is a standalone or event session.
 */
export interface ParticipantContext {
  participantName: string | null;
  ideaName: string | null;
  ideaPitch: string | null;
  buildTool: string;
  eventName: string | null;
}
