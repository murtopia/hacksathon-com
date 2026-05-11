import Link from "next/link";
import { Check, Circle, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

export type BlockStatus = "upcoming" | "active" | "completed";

export type BlockKey =
  | "ZERO"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "FINAL"
  | "+01"
  | "+02";

export interface BlockChecklistItem {
  id: string;
  blockKey: BlockKey | string;
  title: string;
  subtitle: string | null;
  status: BlockStatus;
  scheduledDate: string | null;
  durationMinutes: number;
}

interface BlockChecklistProps {
  eventId: string;
  blocks: BlockChecklistItem[];
}

/**
 * Visual list of every block in an event. Each row is a Link to the
 * corresponding block-specific screen. Status drives the affordance:
 *   completed  → muted with a check
 *   active     → foreground accent, ring around the badge
 *   upcoming   → muted outline
 *
 * Block keys render as a 3-character label inside a square badge so the
 * timeline reads as a clear sequence (ZERO • 01 • 02 • … • FINAL • +01).
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
      {blocks.map((block) => (
        <li key={block.id}>
          <Link
            href={`/events/${eventId}/blocks/${encodeBlockKey(block.blockKey)}`}
            className={cn(
              "group flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
              block.status === "completed" &&
                "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60",
              block.status === "active" &&
                "border-foreground/30 bg-background text-foreground shadow-sm hover:border-foreground/60",
              block.status === "upcoming" &&
                "border-border text-foreground hover:bg-muted/40",
            )}
          >
            <BlockBadge blockKey={block.blockKey} status={block.status} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium truncate",
                    block.status === "completed" && "line-through decoration-muted-foreground/50",
                  )}
                >
                  {block.title}
                </span>
                {block.status === "active" && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    Now
                  </span>
                )}
              </div>
              {block.subtitle && (
                <span className="text-xs text-muted-foreground truncate">
                  {block.subtitle}
                </span>
              )}
            </div>
            <BlockStatusIcon status={block.status} />
          </Link>
        </li>
      ))}
    </ol>
  );
}

function BlockBadge({
  blockKey,
  status,
}: {
  blockKey: string;
  status: BlockStatus;
}) {
  return (
    <span
      className={cn(
        "flex h-9 w-12 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tracking-wide",
        status === "completed" &&
          "border-border bg-muted text-muted-foreground",
        status === "active" &&
          "border-foreground bg-foreground text-background ring-2 ring-foreground/20 ring-offset-2 ring-offset-background",
        status === "upcoming" && "border-border bg-background text-foreground",
      )}
    >
      {blockKey}
    </span>
  );
}

function BlockStatusIcon({ status }: { status: BlockStatus }) {
  if (status === "completed") {
    return <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
  }
  if (status === "active") {
    return <Dot className="size-6 shrink-0 -mr-1 text-foreground" aria-hidden />;
  }
  return <Circle className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />;
}

/**
 * `+01` and `+02` contain a literal plus sign, which is reserved in URL
 * path segments. Encode it so the dynamic route receives the original
 * key on the server side.
 */
function encodeBlockKey(key: string): string {
  return encodeURIComponent(key);
}
