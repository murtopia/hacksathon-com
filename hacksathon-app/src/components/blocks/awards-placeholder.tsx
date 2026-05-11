import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Awards (+01) — M4 will land the real voting flow. Until then, an
 * intentional placeholder so participants know this block exists and
 * what it's for.
 */
export function AwardsPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voting opens after Showcase</CardTitle>
        <CardDescription>
          When the demos wrap, you&apos;ll cast votes across the award categories
          right here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          We&apos;ll let you know as soon as voting is live.
        </p>
      </CardContent>
    </Card>
  );
}
