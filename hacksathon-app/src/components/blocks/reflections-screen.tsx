import {
  ReflectionForm,
  type ReflectionAnswer,
  type ReflectionQuestion,
} from "./reflection-form";

export type ReflectionStatus = "closed" | "open" | "complete";

interface ReflectionsScreenProps {
  eventId: string;
  questions: ReflectionQuestion[];
  initialAnswers: ReflectionAnswer[];
  status: ReflectionStatus;
}

/**
 * Reflections block (+02), gated on the event's reflection status:
 *
 * - closed (pre-open): nothing to fill yet - a single calm "check back"
 *   line. We don't show editable fields that can't actually save.
 * - open: the autosaving question form (no submit button - answers save
 *   as you type; the first save marks +02 done on the event home).
 * - complete (post-event, locked): the participant's own answers shown
 *   read-only so they can still review what they wrote.
 *
 * Allowed after event lock: lock semantics gate the creative artifacts
 * (ideas, briefs, sessions), not retrospectives.
 */
export function ReflectionsScreen({
  eventId,
  questions,
  initialAnswers,
  status,
}: ReflectionsScreenProps) {
  if (questions.length === 0) {
    return (
      <div className="space-y-1">
        <p className="mono-label">Reflections</p>
        <p className="font-serif text-sm italic text-muted-foreground/80">
          Your organizer hasn&apos;t added reflection questions yet. Check back
          after the showcase.
        </p>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <section className="space-y-2">
        <p className="mono-label">Reflections</p>
        <p className="font-serif text-sm italic text-muted-foreground/80">
          Check back in after the Hacky Awards to leave your feedback.
        </p>
      </section>
    );
  }

  if (status === "complete") {
    const answered = initialAnswers.filter((a) => a.answer.trim().length > 0);
    if (answered.length === 0) {
      return (
        <section className="space-y-2">
          <p className="mono-label">Reflections</p>
          <p className="font-serif text-sm italic text-muted-foreground/80">
            Reflections are closed for this event.
          </p>
        </section>
      );
    }

    const answerById = new Map(answered.map((a) => [a.questionId, a.answer]));
    return (
      <section className="space-y-6">
        <p className="font-serif text-sm italic text-muted-foreground/80">
          Reflections are closed - thanks for sharing.
        </p>
        <div className="space-y-6 border-l border-border pl-4 sm:pl-6">
          {questions.map((q) => {
            const answer = answerById.get(q.id);
            if (!answer) return null;
            return (
              <div key={q.id} className="space-y-1.5">
                <p className="font-serif text-base leading-snug text-foreground">
                  {q.question_text}
                </p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {answer}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <p className="font-serif text-sm italic text-muted-foreground/80">
        A few quick prompts to capture what you&apos;re taking forward. Answers
        save as you type - there&apos;s no submit button.
      </p>
      <div className="border-l border-border pl-4 sm:pl-6">
        <ReflectionForm
          eventId={eventId}
          questions={questions}
          initialAnswers={initialAnswers}
        />
      </div>
    </section>
  );
}
