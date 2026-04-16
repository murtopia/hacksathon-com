export interface StepDefinition {
  number: number;
  key: string;
  title: string;
  openingQuestion: string;
  coachingTip: string;
  /**
   * For steps 2-5, the opening question references prior context.
   * This flag tells the API route to let the AI generate the opening
   * from the full conversation history rather than using a static string.
   */
  aiGeneratedOpening: boolean;
}

export const STEPS: StepDefinition[] = [
  {
    number: 1,
    key: "core_function",
    title: "Core Function",
    openingQuestion:
      "What does this do? Describe the core function in one sentence.",
    coachingTip:
      'Try to boil it down to one verb and one outcome. "It lets people [verb] their [noun]."',
    aiGeneratedOpening: false,
  },
  {
    number: 2,
    key: "target_user",
    title: "Target User",
    openingQuestion:
      "Who specifically is this for? Describe one real person who would use it.",
    coachingTip:
      "Not 'busy professionals' — more like 'a dad who travels for work and misses bedtime.'",
    aiGeneratedOpening: true,
  },
  {
    number: 3,
    key: "visual_direction",
    title: "Visual Direction",
    openingQuestion:
      "How should this look and feel? Share a reference app or site you like, and describe the vibe.",
    coachingTip:
      "Think about the mood: clean and minimal? Bold and playful? Dark and serious? A screenshot or URL helps.",
    aiGeneratedOpening: true,
  },
  {
    number: 4,
    key: "scope_guard",
    title: "Scope Guard",
    openingQuestion:
      "What does this NOT do? Give me at least two things that are out of scope.",
    coachingTip:
      "Saying no to things is what makes a v1 shippable. If everything is in, nothing stands out.",
    aiGeneratedOpening: true,
  },
  {
    number: 5,
    key: "done_state",
    title: "Done State",
    openingQuestion:
      "What does done look like? Your build is complete when ___.",
    coachingTip:
      "Make it specific enough that you could demo it in 3 minutes. If you can't demo it, it's too big.",
    aiGeneratedOpening: true,
  },
];

export const TOTAL_STEPS = STEPS.length;

export function getStep(stepNumber: number): StepDefinition | undefined {
  return STEPS.find((s) => s.number === stepNumber);
}

export function isLastStep(stepNumber: number): boolean {
  return stepNumber === TOTAL_STEPS;
}
