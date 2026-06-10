import { Badge } from "@/components/ui/badge";
import { statusLabel, type IdeaWithAuthor } from "@/lib/idealab/types";

interface IdeaDetailProps {
  initialIdea: IdeaWithAuthor;
  /**
   * Accepted for API compatibility with older call sites - IdeaDetail
   * is now read-only and never branches on this flag. Owner-editor
   * flows live in `IdeaProgressTimeline`.
   */
  isOwner?: boolean;
  /**
   * Accepted for API compatibility. Not used by the read-only render.
   */
  eventId?: string;
  slug?: string;
  buildTool?: string;
}

/**
 * Read-only public detail view for an idea - the surface used by the
 * gallery detail route for non-owner visitors.
 *
 * Owner editing used to live here too (Title / Pitch / Description /
 * Status / Live URL / Screenshot card pair), but that responsibility
 * has moved to `IdeaProgressTimeline` on `/[slug]/idea`. Keeping this
 * file lean means the gallery detail surface stops shipping a wad of
 * unreachable client code.
 */
export function IdeaDetail({ initialIdea }: IdeaDetailProps) {
  const idea = initialIdea;
  const isCompleted = idea.status === "completed";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <h2>{idea.title}</h2>
          <Badge
            variant={isCompleted ? "default" : "outline"}
            className={isCompleted ? "shrink-0" : "shrink-0 border-gray-400 text-muted-foreground"}
          >
            {statusLabel(idea.status)}
          </Badge>
        </div>
        <p className="mono-label">{idea.authorName ?? "Anonymous"}</p>
      </header>

      <section className="space-y-3">
        <p className="mono-label">The teaser</p>
        <p className="lead">{idea.pitch}</p>
      </section>

      {idea.description && (
        <section className="space-y-3">
          <p className="mono-label">More about it</p>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
            {idea.description}
          </p>
        </section>
      )}

      {isCompleted && idea.liveUrl && (
        <section className="space-y-3">
          <p className="mono-label">Live URL</p>
          <a
            href={idea.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base underline underline-offset-4"
          >
            {idea.liveUrl}
          </a>
        </section>
      )}

      {isCompleted && idea.finalScreenshotUrl && (
        <section className="space-y-3">
          <p className="mono-label">Final screenshot</p>
          <div className="aspect-video w-full overflow-hidden rounded-[4px] border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={idea.finalScreenshotUrl}
              alt={`${idea.title} screenshot`}
              className="h-full w-full object-cover"
              style={{
                objectPosition: `${idea.heroCropX ?? 50}% ${idea.heroCropY ?? 50}%`,
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
