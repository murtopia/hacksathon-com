import { cn } from "@/lib/utils";

/**
 * Static marketing rendition of the product's block timeline: numbered
 * blocks, names, and durations, in the visual language of the showcase
 * run-of-show (`blocks-playbook.tsx`). Used on The Program and How It
 * Works pages per the locked site copy's "(Visual: the block timeline)"
 * production notes.
 *
 * Data mirrors the default event template (migrations 00014/00024): the
 * canonical 10-block program, Kickoff to Reflections.
 */

const PROGRAM_BLOCKS: ReadonlyArray<{
  blockKey: string;
  title: string;
  subtitle?: string;
  /** Display label; the Showcase Showdown runs as a range by team size. */
  duration: string;
}> = [
  { blockKey: "ZERO", title: "Kickoff", duration: "15 min" },
  { blockKey: "01", title: "Sprint to the IdeaLab", duration: "30 min" },
  {
    blockKey: "02",
    title: "Shark Tank, Minus the Sharks",
    duration: "45 min",
  },
  {
    blockKey: "03",
    title: "Documentation Is Everything",
    duration: "30 min",
  },
  {
    blockKey: "04",
    title: "Here We Go!",
    subtitle: "Build Session 1",
    duration: "45 min",
  },
  { blockKey: "05", title: "Build Session 2", duration: "45 min" },
  { blockKey: "06", title: "Your Final Build Session", duration: "45 min" },
  { blockKey: "FINAL", title: "Showcase Showdown", duration: "60 to 120 min" },
  { blockKey: "+01", title: "Hacky Awards", duration: "30 min" },
  { blockKey: "+02", title: "Reflections", duration: "20 min" },
];

export function ProgramBlocksTimeline() {
  return (
    <ol
      className={cn(
        "relative pl-16",
        "before:pointer-events-none before:absolute before:left-[18px] before:top-1 before:bottom-1 before:w-px before:bg-border",
        "max-sm:pl-10 max-sm:before:left-[10px]",
      )}
    >
      {PROGRAM_BLOCKS.map((block) => (
        <li key={block.blockKey} className="relative mb-7 last:mb-0">
          <span
            aria-hidden
            className={cn(
              "absolute top-[6px] size-[13px] rounded-full border-2 border-foreground bg-background",
              "-left-[52px] max-sm:-left-[34px] max-sm:size-[11px]",
            )}
          />
          <div className="flex flex-wrap items-baseline gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-1">
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
            <span className="whitespace-nowrap rounded-[2px] bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              {block.duration}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
