import {
  ReflectionForm,
  type ReflectionAnswer,
  type ReflectionQuestion,
} from "./reflection-form";

interface ReflectionsScreenProps {
  eventId: string;
  questions: ReflectionQuestion[];
  initialAnswers: ReflectionAnswer[];
}

/**
 * Reflections block (+02). Renders the question list as a single
 * autosaving form. There's no submit button - answers save as you
 * type. Once you've saved at least one answer, the event home
 * checklist auto-marks this block as done.
 *
 * Allowed after event lock: lock semantics gate the creative artifacts
 * (ideas, briefs, sessions), not retrospectives. Showing this even
 * after reveal is a feature, not a bug - people who didn't get to
 * reflect during the event can still come back.
 */
export function ReflectionsScreen({
  eventId,
  questions,
  initialAnswers,
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
