import { cn } from "@/lib/utils";

export interface PlaybookBlock {
  blockKey: string;
  title: string;
  subtitle: string | null;
  durationMinutes: number;
  description: string | null;
  purpose: string | null;
}

interface BlocksPlaybookProps {
  blocks: PlaybookBlock[];
  eyebrow?: string;
  heading?: string;
  blurb?: string;
}

/**
 * The event's run-of-show - the "here's exactly how we ran it" section.
 *
 * Read-only editorial port of the participant block timeline
 * (`event-home/blocks-timeline.tsx`): a vertical 1px rule with a circular
 * connector per block, mono block key, serif title, duration pill,
 * description, and an italic purpose line. No checklists, no scheduled
 * dates, no interactive state - this is the published playbook, not a
 * live agenda.
 */
export function BlocksPlaybook({
  blocks,
  eyebrow,
  heading,
  blurb,
}: BlocksPlaybookProps) {
  if (blocks.length === 0) return null;

  return (
    <section id="playbook" className="border-b bg-muted/30">
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 py-16 sm:py-20">
        <header className="mb-10 space-y-2">
          <p className="mono-label">{eyebrow ?? "The playbook"}</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            {heading ?? "How we ran it"}
          </h2>
          <p className="lead">
            {blurb ??
              "The exact run-of-show, block by block - steal it for your own team."}
          </p>
        </header>

        <ol
          className={cn(
            "relative pl-16",
            "before:pointer-events-none before:absolute before:left-[18px] before:top-1 before:bottom-1 before:w-px before:bg-border",
            "max-sm:pl-10 max-sm:before:left-[10px]",
          )}
        >
          {blocks.map((block) => (
            <li key={block.blockKey} className="relative mb-10 last:mb-0">
              <span
                aria-hidden
                className={cn(
                  "absolute top-[6px] size-[13px] rounded-full border-2 border-foreground bg-background",
                  "-left-[52px] max-sm:-left-[34px] max-sm:size-[11px]",
                )}
              />
              <header className="flex flex-wrap items-baseline gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-1">
                <span className="min-w-12 font-mono text-sm font-bold uppercase tracking-wide tabular-nums text-foreground">
                  {block.blockKey}
                </span>
                <h3 className="font-serif text-2xl leading-snug text-foreground">
                  {block.title}
                </h3>
                {block.subtitle && (
                  <span className="text-sm text-muted-foreground">
                    {block.subtitle}
                  </span>
                )}
                {block.durationMinutes > 0 && (
                  <span className="whitespace-nowrap rounded-[2px] bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                    {block.durationMinutes} min
                  </span>
                )}
              </header>
              {block.description && (
                <p className="mt-2 max-w-[560px] text-base leading-relaxed text-muted-foreground">
                  {block.description}
                </p>
              )}
              {block.purpose && (
                <p className="mt-1 font-serif text-sm italic text-muted-foreground/70">
                  {block.purpose}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
