"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { statusLabel, type IdeaWithAuthor } from "@/lib/idealab/types";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";
import { IdeaDetailsModal } from "./idea-details-modal";

interface IdeaCardProps {
  idea: IdeaWithAuthor;
  /** Vanity slug for the parent event - used by the details modal to route owners into the editor. */
  slug: string;
  isOwner: boolean;
}

/**
 * Gallery tile - mirrors the original IdeaLab editorial card
 * (`seven2-idealab/src/components/IdeaCard.tsx`):
 *
 *   - Author row (avatar + name + relative date) with a softened
 *     gray-400 status pill
 *   - Serif title, line-clamp-2
 *   - Pitch as a short subtitle right under the title (text-base,
 *     line-clamp-3, ellipsis on overflow)
 *   - 16:9 hero with a thin border and clearly rounded corners (we
 *     hard-code 8px because our design system's `--radius` is 4px,
 *     half of IdeaLab's, so `rounded-lg` reads as nearly square)
 *   - Description teaser in a tinted muted-bg pill (line-clamp-4,
 *     ellipsis truncation)
 *   - Bottom "Project Details" button (gray-400 outline) that opens
 *     the `IdeaDetailsModal` along with every other clickable surface
 *     on the card - all clicks land in the modal so non-owners and
 *     owners share the same read-only entry point. Owners reach the
 *     editor via the modal's `Edit idea` shortcut (or the existing
 *     "Your Idea" nav link).
 */
export function IdeaCard({ idea, slug, isOwner }: IdeaCardProps) {
  const [open, setOpen] = useState(false);
  const isCompleted = idea.status === "completed";
  const monogram = (idea.title?.trim()?.[0] ?? "?").toUpperCase();
  const pitch = idea.pitch?.trim() ?? "";
  const description = idea.description?.trim() ?? "";

  function openModal() {
    setOpen(true);
  }

  return (
    <>
      <Card className="h-full transition-colors hover:border-foreground/30">
        <div className="flex flex-1 flex-col gap-4 px-4">
          <div className="flex items-start gap-3">
            <UserAvatar
              name={idea.authorName}
              avatarUrl={idea.authorAvatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate font-serif text-base text-foreground">
                {idea.authorName ?? "Anonymous"}
                {isOwner && (
                  <span className="ml-1 text-muted-foreground">· You</span>
                )}
              </p>
              <p className="flex items-center gap-1 font-serif text-sm text-muted-foreground">
                <Calendar className="size-3.5" aria-hidden="true" />
                {formatRelativeUpdatedAt(idea.updatedAt)}
              </p>
            </div>
            <Badge
              variant={isCompleted ? "default" : "outline"}
              className={
                isCompleted
                  ? "shrink-0"
                  : "shrink-0 border-[var(--gray-400)] text-[var(--gray-400)]"
              }
            >
              {statusLabel(idea.status)}
            </Badge>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="group/title block w-full text-left"
          >
            <h3 className="mb-2 font-serif text-xl leading-snug text-foreground line-clamp-2 transition-colors group-hover/title:text-foreground/70">
              {idea.title}
            </h3>
            {pitch && (
              <p className="font-serif text-base leading-relaxed text-muted-foreground line-clamp-2">
                {pitch}
              </p>
            )}
          </button>

          <button
            type="button"
            onClick={openModal}
            aria-label={`Open ${idea.title}`}
            className="mt-1 block aspect-video w-full overflow-hidden rounded-[8px] border border-border bg-muted"
          >
            {idea.finalScreenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={idea.finalScreenshotUrl}
                alt={`${idea.title} image`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  objectPosition: `${idea.heroCropX ?? 50}% ${idea.heroCropY ?? 50}%`,
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                <span
                  className="font-serif text-6xl text-foreground/30"
                  aria-hidden="true"
                >
                  {monogram}
                </span>
              </div>
            )}
          </button>

          {description && (
            <button
              type="button"
              onClick={openModal}
              className="block w-full rounded-[8px] bg-muted/40 px-3 py-2 text-left"
            >
              <span className="line-clamp-3 font-serif text-sm leading-relaxed text-foreground/80">
                {description}
              </span>
            </button>
          )}

          <div className="mt-auto pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={openModal}
              className="w-full border-[var(--gray-400)] font-serif text-base normal-case tracking-normal text-[var(--gray-400)] hover:border-foreground hover:text-foreground"
            >
              Project Details
            </Button>
          </div>
        </div>
      </Card>

      <IdeaDetailsModal
        idea={idea}
        slug={slug}
        isOwner={isOwner}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
