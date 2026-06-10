import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatScheduledDate,
  type WindowStatus,
} from "@/lib/blocks/status";

export interface BlocksTimelineChecklistGroup {
  title?: string;
  items: string[];
  /** Render as a soft check-in callout (gray-50 bg + left border) instead of a plain group. */
  isCheckin?: boolean;
}

export interface BlocksTimelineItem {
  id: string;
  blockKey: string;
  title: string;
  /** Long-form description paragraph. Maps to `blocks.description`. */
  description: string | null;
  /** Italic intent line below the description. Maps to `blocks.purpose`. */
  intent: string | null;
  /** Short subtitle (used as a fallback when description is missing). */
  subtitle: string | null;
  windowStatus: WindowStatus;
  mineDone: boolean;
  scheduledDate: string | null;
  durationMinutes: number;
  checklists: BlocksTimelineChecklistGroup[];
}

interface BlocksTimelineProps {
  basePath: string;
  blocks: BlocksTimelineItem[];
}

/**
 * Editorial port of the original `hacks.murtopolis.com` block-card
 * timeline. A vertical 1px rule runs down the left with a circular
 * connector per block.
 *
 * Two state signals are layered quietly so the design stays grayscale:
 *
 *   mineDone     → connector fills solid black (terminal-positive) and
 *                  the block key label drops to muted. Title stays
 *                  unstruck - the filled circle is signal enough.
 *   windowStatus → an inline "NOW" mono pill appears next to the
 *                  duration badge when the scheduled window is active.
 *
 * Each row's headline is a Link to `/[basePath]/[blockKey]`. The
 * checklist toggle is a sibling `<details>` element so it does not
 * intercept navigation clicks.
 */
export function BlocksTimeline({ basePath, blocks }: BlocksTimelineProps) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-[4px] border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Your timeline blocks will appear here once they&apos;re set up.
        </p>
      </div>
    );
  }

  return (
    <ol
      className={cn(
        "relative mt-6 pl-16",
        "before:pointer-events-none before:absolute before:left-[18px] before:top-1 before:bottom-1 before:w-px before:bg-border",
        "sm:pl-16",
        "max-sm:pl-10 max-sm:before:left-[10px]",
      )}
    >
      {blocks.map((block) => (
        <BlocksTimelineRow
          key={block.id}
          block={block}
          href={`${basePath}/${encodeBlockKey(block.blockKey)}`}
        />
      ))}
    </ol>
  );
}

function BlocksTimelineRow({
  block,
  href,
}: {
  block: BlocksTimelineItem;
  href: string;
}) {
  const isActive = block.windowStatus === "active";
  const isUpcoming = block.windowStatus === "upcoming";
  const formattedDate = formatScheduledDate(block.scheduledDate);
  const description = block.description ?? null;
  const intent = block.intent ?? null;
  const subtitle = block.subtitle ?? null;
  const hasChecklists = block.checklists.length > 0;

  return (
    <li className="relative mb-10 last:mb-0">
      <span
        aria-hidden
        className={cn(
          "absolute top-[6px] size-[13px] rounded-full border-2 border-foreground bg-background transition-colors",
          "-left-[52px] max-sm:-left-[34px] max-sm:size-[11px]",
          block.mineDone && "bg-foreground",
          !block.mineDone &&
            isActive &&
            "ring-2 ring-foreground/20 ring-offset-2 ring-offset-background",
        )}
      />
      <Link
        href={href}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <header className="flex flex-wrap items-baseline gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-1">
          <span
            className={cn(
              "min-w-12 font-mono text-sm font-bold uppercase tracking-wide tabular-nums",
              block.mineDone
                ? "text-muted-foreground"
                : "text-foreground",
            )}
          >
            {block.blockKey}
          </span>
          <h3
            className={cn(
              "font-serif text-2xl leading-snug text-foreground transition-colors",
              "group-hover:text-foreground",
            )}
          >
            {block.title}
          </h3>
          {block.durationMinutes > 0 && (
            <span className="whitespace-nowrap rounded-[2px] bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              {block.durationMinutes} min
            </span>
          )}
          {isActive && !block.mineDone && (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
              Now
            </span>
          )}
        </header>
        {(description || subtitle) && (
          <p className="mt-2 max-w-[560px] text-base leading-relaxed text-muted-foreground">
            {description ?? subtitle}
          </p>
        )}
        {intent && (
          <p className="mt-1 font-serif text-sm italic text-muted-foreground/70">
            {intent}
          </p>
        )}
        {(formattedDate || (isUpcoming && block.scheduledDate)) && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/80">
            {formattedDate}
          </p>
        )}
      </Link>
      {hasChecklists && <ChecklistDetails groups={block.checklists} />}
    </li>
  );
}

function ChecklistDetails({
  groups,
}: {
  groups: BlocksTimelineChecklistGroup[];
}) {
  return (
    <details className="group/checklist mt-4">
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-2 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors",
          "hover:text-foreground",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        Checklist
        <ChevronDown
          aria-hidden
          className="size-3.5 transition-transform duration-150 group-open/checklist:rotate-180"
        />
      </summary>
      <div className="mt-4 ml-4 border-l border-border pl-4">
        {groups.map((group, idx) => (
          <ChecklistGroup key={idx} group={group} />
        ))}
      </div>
    </details>
  );
}

function ChecklistGroup({ group }: { group: BlocksTimelineChecklistGroup }) {
  if (group.isCheckin) {
    return (
      <div className="mb-5 -ml-4 border-l-2 border-border bg-muted/60 p-4 last:mb-0">
        {group.title && (
          <h4 className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h4>
        )}
        <p className="font-serif text-base italic text-muted-foreground">
          {group.items.join(" ")}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 last:mb-0">
      {group.title && (
        <h4 className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {group.title}
        </h4>
      )}
      <ul className="space-y-1">
        {group.items.map((item, i) => (
          <li
            key={i}
            className="relative py-1 pl-7 text-sm text-muted-foreground before:absolute before:left-0 before:top-1/2 before:size-[14px] before:-translate-y-1/2 before:rounded-[2px] before:border-[1.5px] before:border-[--border-strong]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
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

/**
 * Best-effort parser for the `blocks.checklists` JSONB column. Accepts
 * the same shape as the original Hacks site:
 *
 *   [
 *     { "title": "Participant Requirements", "items": ["...", "..."] },
 *     { "title": "Next Day Check-In", "isCheckin": true, "items": ["..."] }
 *   ]
 *
 * Strings are wrapped into a single-item group with no title for
 * backwards compatibility with very early seed data.
 */
export function parseBlockChecklists(
  raw: unknown,
): BlocksTimelineChecklistGroup[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): BlocksTimelineChecklistGroup | null => {
      if (typeof entry === "string") return { items: [entry] };
      if (entry && typeof entry === "object") {
        const obj = entry as {
          title?: unknown;
          items?: unknown;
          isCheckin?: unknown;
          is_checkin?: unknown;
        };
        const items = Array.isArray(obj.items)
          ? obj.items.filter((i): i is string => typeof i === "string")
          : [];
        if (items.length === 0) return null;
        const isCheckin = Boolean(obj.isCheckin ?? obj.is_checkin);
        return {
          title: typeof obj.title === "string" ? obj.title : undefined,
          items,
          isCheckin,
        };
      }
      return null;
    })
    .filter(
      (g): g is BlocksTimelineChecklistGroup => g !== null,
    );
}
