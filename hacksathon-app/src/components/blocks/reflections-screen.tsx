import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
 * autosaving form. There's no submit button — answers save as you
 * type. Once you've saved at least one answer, the event home
 * checklist auto-marks this block as done.
 *
 * Allowed after event lock: lock semantics gate the creative artifacts
 * (ideas, briefs, sessions), not retrospectives. Showing this even
 * after reveal is a feature, not a bug — people who didn't get to
 * reflect during the event can still come back.
 */
export function ReflectionsScreen({
  eventId,
  questions,
  initialAnswers,
}: ReflectionsScreenProps) {
  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No questions set up yet</CardTitle>
          <CardDescription>
            Your organizer hasn&apos;t added reflection questions. Check back
            after the showcase.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-foreground/20 bg-foreground/[0.02]">
        <CardHeader>
          <CardTitle className="text-base">Lock it in</CardTitle>
          <CardDescription>
            A few quick prompts to capture what you&apos;re taking forward.
            Answers save as you type — there&apos;s no submit button.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReflectionForm
            eventId={eventId}
            questions={questions}
            initialAnswers={initialAnswers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
