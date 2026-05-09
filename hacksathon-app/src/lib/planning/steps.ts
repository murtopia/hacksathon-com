export interface StepDefinition {
  number: number;
  key: string;
  title: string;
  /**
   * Question template the AI uses to open this step.
   * `[Project Name]` placeholder is interpolated by the AI from
   * conversation context (set in Step 1 or pre-loaded from IdeaLab).
   */
  questionTemplate: string;
  /**
   * Short coaching tip shown above the input. Plain prose, no jargon.
   */
  coachingTip: string;
  /**
   * For Step 1, the AI may use a static opening if no IdeaLab entry
   * exists (Scenario B). For Steps 2-5, the AI always generates the
   * opening from full conversation history.
   */
  aiGeneratedOpening: boolean;
}

/**
 * The five planning steps, copy verbatim from Session 2 doc Section 4.
 */
export const STEPS: StepDefinition[] = [
  {
    number: 1,
    key: "what_it_does",
    title: "What it does",
    questionTemplate:
      "In your own words, what does [Project Name] do? Tell me like you'd explain it to a friend.",
    coachingTip:
      "Plain language wins here. Skip the buzzwords. Imagine telling a friend at dinner.",
    aiGeneratedOpening: false,
  },
  {
    number: 2,
    key: "who_its_for",
    title: "Who it's for",
    questionTemplate:
      "Who's the first real person you'd show this to when it's done? Tell me about them — not a demographic, just someone specific.",
    coachingTip:
      "Pick one real person. Their situation is more useful than \"busy professionals.\"",
    aiGeneratedOpening: true,
  },
  {
    number: 3,
    key: "how_it_feels",
    title: "How it should feel",
    questionTemplate:
      "When someone opens [Project Name] for the first time, what should it feel like? Name a vibe, describe an aesthetic, reference a website you like — or say \"it should feel like [Brand X] but for [Person Y].\"",
    coachingTip:
      "References help. \"Calm but confident, like Linear but warmer\" tells the build tool everything.",
    aiGeneratedOpening: true,
  },
  {
    number: 4,
    key: "the_one_thing",
    title: "The one thing",
    questionTemplate:
      "If [Project Name] could only do one thing when it launches — just one — what is that thing? Finish this sentence: \"[Project Name] helps [someone] do [one thing].\"",
    coachingTip:
      "Saying no to things is what makes a v1 shippable. We can name v2 stuff in a minute.",
    aiGeneratedOpening: true,
  },
  {
    number: 5,
    key: "done_looks_like",
    title: "Done looks like",
    questionTemplate:
      "Last one: how will you know when it's done enough to demo? What's the minimum that has to actually work for you to feel good showing it at the Showcase Showdown?",
    coachingTip:
      "If you can demo it in 3 minutes and feel proud, that's done. Be specific about what \"working\" means.",
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
