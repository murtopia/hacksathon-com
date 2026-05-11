import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Reflections (+02) — M4 will land the real reflection form (one
 * question per row from event_templates.reflection_questions). Until
 * then, an intentional placeholder.
 */
export function ReflectionsPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reflections coming soon</CardTitle>
        <CardDescription>
          A short set of questions to lock in what you&apos;re taking forward from
          today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We&apos;ll surface the prompts here once the showcase is done.
        </p>
      </CardContent>
    </Card>
  );
}
