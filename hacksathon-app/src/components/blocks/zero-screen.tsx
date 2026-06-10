import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ZeroChecklistGroup {
  title?: string;
  items: string[];
}

interface ZeroScreenProps {
  description: string | null;
  purpose: string | null;
  checklists: ZeroChecklistGroup[];
}

/**
 * Kickoff block - purely read-only. Renders whatever the organizer set
 * up in the block row (description, purpose, checklists). Most events
 * will lean on the default template's description.
 */
export function ZeroScreen({
  description,
  purpose,
  checklists,
}: ZeroScreenProps) {
  return (
    <div className="space-y-6">
      {description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What this is</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
      )}

      {purpose && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why we do it</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">{purpose}</p>
          </CardContent>
        </Card>
      )}

      {checklists.length > 0 &&
        checklists.map((group, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-base">
                {group.title ?? "Checklist"}
              </CardTitle>
              <CardDescription>Get ready before we start.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden className="text-muted-foreground">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

      {!description && !purpose && checklists.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Your organizer will add Kickoff details here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
