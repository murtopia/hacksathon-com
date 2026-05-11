import Link from "next/link";
import { Check, Circle, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatScheduledDate,
  type WindowStatus,
} from "@/lib/blocks/status";

export interface BlockChecklistItem {
  id: string;
  blockKey: string;
  title: string;
  subtitle: string | null;
  windowStatus: WindowStatus;
  mineDone: boolean;
  scheduledDate: string | null;
  durationMinutes: number;
}

interface BlockChecklistProps {
  eventId: string;
  blocks: BlockChecklistItem[];
}

/**
 * Visual list of every block in an event. Each row is a Link to the
 * corresponding block-specific screen. Two signals drive the row:
 *
 *   windowStatus  — organizer-scheduled window state ("Happening now"
 *                   badge when active).
 *   mineDone      — the current user has completed this block (either
 *                   the time window passed, an auto-derive trigger
 *                   fired, or an explicit Lock-style button was tapped).
 *
 * Right-side icon: check (mineDone) > Dot (active) > hollow circle
 * (otherwise). Title is struck through when mineDone.
 */
export function BlockChecklist({ eventId, blocks }: BlockChecklistProps) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Your timeline blocks will appear here once they&apos;re set up.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {blocks.map((block) => {
        const formattedDate = formatScheduledDate(block.scheduledDate);
        const isActive = block.windowStatus === "active";

        return (
          <li key={block.id}>
            <Link
              href={`/events/${eventId}/blocks/${encodeBlockKey(block.blockKey)}`}
              className={cn(
                "group flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
                block.mineDone &&
                  "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60",
                !block.mineDone &&
                  isActive &&
                  "border-foreground/30 bg-background text-foreground shadow-sm hover:border-foreground/60",
                !block.mineDone &&
                  !isActive &&
                  "border-border text-foreground hover:bg-muted/40",
              )}
            >
              <BlockBadge
                blockKey={block.blockKey}
                windowStatus={block.windowStatus}
                mineDone={block.mineDone}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium truncate",
                      block.mineDone &&
                        "line-through decoration-muted-foreground/50",
                    )}
                  >
                    {block.title}
                  </span>
                  {isActive && !block.mineDone && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Now
                    </span>
                  )}
                </div>
                {(formattedDate || block.subtitle) && (
                  <span className="text-xs text-muted-foreground truncate">
                    {formattedDate ?? block.subtitle}
                  </span>
                )}
              </div>
              <BlockStatusIcon
                windowStatus={block.windowStatus}
                mineDone={block.mineDone}
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function BlockBadge({
  blockKey,
  windowStatus,
  mineDone,
}: {
  blockKey: string;
  windowStatus: WindowStatus;
  mineDone: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-12 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tracking-wide",
        mineDone && "border-border bg-muted text-muted-foreground",
        !mineDone &&
          windowStatus === "active" &&
          "border-foreground bg-foreground text-background ring-2 ring-foreground/20 ring-offset-2 ring-offset-background",
        !mineDone &&
          windowStatus !== "active" &&
          "border-border bg-background text-foreground",
      )}
    >
      {blockKey}
    </span>
  );
}

function BlockStatusIcon({
  windowStatus,
  mineDone,
}: {
  windowStatus: WindowStatus;
  mineDone: boolean;
}) {
  if (mineDone) {
    return (
      <Check
        className="size-4 shrink-0 text-muted-foreground"
        aria-label="Completed"
      />
    );
  }
  if (windowStatus === "active") {
    return (
      <Dot className="size-6 shrink-0 -mr-1 text-foreground" aria-hidden />
    );
  }
  return (
    <Circle
      className="size-3 shrink-0 text-muted-foreground/60"
      aria-hidden
    />
  );
}

/**
 * `+01` and `+02` contain a literal plus sign, which is reserved in URL
 * path segments. Encode it so the dynamic route receives the original
 * key on the server side.
 */
function encodeBlockKey(key: string): string {
  return encodeURIComponent(key);
}
