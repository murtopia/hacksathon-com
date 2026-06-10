"use client";

import Link from "next/link";
import { Calendar, ExternalLink, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { statusLabel, type IdeaWithAuthor } from "@/lib/idealab/types";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";

interface IdeaDetailsModalProps {
  idea: IdeaWithAuthor;
  slug: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Read-only project details modal launched from the gallery card.
 *
 * Sticky header pairs the author row on the left with status + close
 * affordances on the right. Below that, the title and full pitch get
 * the full width. The body then has the hero image and full
 * description, and the footer holds the optional external link plus
 * an owner-only shortcut into the editor.
 *
 * We disable `DialogContent`'s default top-right close button because
 * the sticky header band paints over it; we render our own close
 * inside that band so it stays anchored as the body scrolls.
 */
export function IdeaDetailsModal({
  idea,
  slug,
  isOwner,
  open,
  onOpenChange,
}: IdeaDetailsModalProps) {
  const isCompleted = idea.status === "completed";
  const pitch = idea.pitch?.trim() ?? "";
  const description = idea.description?.trim() ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-[calc(100%-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl"
      >
        <div className="sticky top-0 z-10 space-y-4 border-b border-border bg-background px-6 pt-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar
                name={idea.authorName}
                avatarUrl={idea.authorAvatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base text-foreground">
                  {idea.authorName ?? "Anonymous"}
                  {isOwner && (
                    <span className="ml-1 text-muted-foreground">· You</span>
                  )}
                </p>
                <p className="flex items-center gap-1 font-serif text-sm text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  Last updated {formatRelativeUpdatedAt(idea.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant={isCompleted ? "default" : "outline"}
                className={
                  isCompleted
                    ? undefined
                    : "border-[var(--gray-400)] text-[var(--gray-400)]"
                }
              >
                {statusLabel(idea.status)}
              </Badge>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="space-y-2">
            <DialogTitle className="font-serif text-2xl leading-tight text-foreground">
              {idea.title}
            </DialogTitle>
            {pitch && (
              <p className="font-serif text-base leading-relaxed text-muted-foreground">
                {pitch}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {idea.finalScreenshotUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-[8px] border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={idea.finalScreenshotUrl}
                alt={`${idea.title} image`}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${idea.heroCropX ?? 50}% ${idea.heroCropY ?? 50}%`,
                }}
              />
            </div>
          )}

          {description && (
            <div className="rounded-[8px] bg-muted/40 px-4 py-3 font-serif text-base leading-relaxed whitespace-pre-wrap text-foreground/85">
              {description}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
          {isOwner && (
            <Button
              asChild
              variant="outline"
              className="font-serif text-base normal-case tracking-normal"
            >
              <Link href={`/${slug}/idea`}>
                <Pencil
                  data-icon="inline-start"
                  className="mr-1.5"
                  aria-hidden="true"
                />
                Edit idea
              </Link>
            </Button>
          )}
          {idea.liveUrl && (
            <Button
              asChild
              variant="outline"
              className="border-[var(--gray-400)] font-serif text-base normal-case tracking-normal text-[var(--gray-400)] hover:border-foreground hover:text-foreground"
            >
              <a
                href={idea.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink
                  data-icon="inline-start"
                  className="mr-1.5"
                  aria-hidden="true"
                />
                View live project
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
