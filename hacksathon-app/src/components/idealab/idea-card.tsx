import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { statusLabel, type IdeaWithAuthor } from "@/lib/idealab/types";

interface IdeaCardProps {
  idea: IdeaWithAuthor;
  eventId: string;
  isOwner: boolean;
}

/**
 * Single idea tile rendered in the gallery grid. Status pill colors
 * map directly onto the `idea_status` enum:
 *   - completed  → solid (success-feeling) badge
 *   - in_progress / idea_stage → muted outline
 */
export function IdeaCard({ idea, eventId, isOwner }: IdeaCardProps) {
  const href = `/events/${eventId}/idealab/${idea.id}`;
  const isCompleted = idea.status === "completed";

  return (
    <Link href={href} className="block group">
      <Card className="h-full transition-colors group-hover:border-foreground/30">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg leading-snug">
              {idea.title}
            </CardTitle>
            <Badge
              variant={isCompleted ? "default" : "outline"}
              className="shrink-0"
            >
              {statusLabel(idea.status)}
            </Badge>
          </div>
          <CardDescription className="line-clamp-3 text-sm">
            {idea.pitch}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{idea.authorName ?? "Anonymous"}</span>
            {isOwner && (
              <span className="text-foreground/70 font-medium">· You</span>
            )}
          </div>
          {isCompleted && idea.finalScreenshotUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={idea.finalScreenshotUrl}
              alt={`${idea.title} screenshot`}
              className="aspect-video w-full rounded-md border object-cover"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
