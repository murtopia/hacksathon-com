import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Showcase",
};

interface ShowcaseEntry {
  /** Mono index label shown in the timeline (e.g. "01"). */
  key: string;
  name: string;
  /** Short descriptor shown beside the name. */
  subtitle?: string;
  /** Pill tag (e.g. project count or status). */
  tag?: string;
  description: string;
  /** Italic purpose/closing line, mirroring the playbook blocks. */
  note?: string;
  /** When present, the entry links to a published wrap-up. */
  href?: string;
  cta?: string;
  /** Renders the entry in a muted "coming soon" treatment. */
  upcoming?: boolean;
}

const entries: ShowcaseEntry[] = [
  {
    key: "01",
    name: "Seven2",
    subtitle: "Advertising & marketing agency",
    tag: "19 projects",
    description:
      "A full-agency Hacks-a-Thon run end to end on Hacksathon.com, from the IdeaLab to a public showcase. Designers, strategists, and project managers shipped real, working apps with no prior coding experience.",
    note: "The case study that started it all.",
    href: "/seven2/final",
    cta: "View the wrap-up",
  },
  {
    key: "02",
    name: "Your team could be next",
    tag: "Coming soon",
    description:
      "More public showcases are on the way. Companies that run a Hacks-a-Thon can opt in to display their projects and outcomes right here.",
    note: "Want your team featured? Run your Hacks-a-Thon and opt in to the showcase.",
    href: "/checkout",
    cta: "Start your Hacks-a-Thon",
    upcoming: true,
  },
];

export default function ShowcasePage() {
  return (
    <div className="mx-auto w-full max-w-[var(--container-narrow)] px-4 py-16 sm:py-20">
      <header className="mb-12 space-y-2">
        <p className="mono-label">Showcase</p>
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
          Real teams. Real builds.
        </h1>
        <p className="lead">
          See what teams have built with Hacksathon.com
          <br />
          Real projects from real Hacks-a-Thons.
        </p>
      </header>

      <ol
        className={cn(
          "relative pl-16",
          "before:pointer-events-none before:absolute before:left-[18px] before:top-1 before:bottom-1 before:w-px before:bg-border",
          "max-sm:pl-10 max-sm:before:left-[10px]",
        )}
      >
        {entries.map((entry) => (
          <li key={entry.key} className="relative mb-10 last:mb-0">
            <span
              aria-hidden
              className={cn(
                "absolute top-[6px] size-[13px] rounded-full border-2 bg-background",
                entry.upcoming ? "border-border" : "border-foreground",
                "-left-[52px] max-sm:-left-[34px] max-sm:size-[11px]",
              )}
            />
            <header className="flex flex-wrap items-baseline gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-1">
              <span
                className={cn(
                  "min-w-12 font-mono text-sm font-bold uppercase tracking-wide tabular-nums",
                  entry.upcoming ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {entry.key}
              </span>
              <h2
                className={cn(
                  "font-serif text-2xl leading-snug sm:text-3xl",
                  entry.upcoming ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {entry.name}
              </h2>
              {entry.subtitle && (
                <span className="text-sm text-muted-foreground">
                  {entry.subtitle}
                </span>
              )}
              {entry.tag && (
                <span className="whitespace-nowrap rounded-[2px] bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                  {entry.tag}
                </span>
              )}
            </header>

            <p className="mt-2 max-w-[560px] text-base leading-relaxed text-muted-foreground">
              {entry.description}
            </p>

            {entry.note && (
              <p className="mt-1 font-serif text-sm italic text-muted-foreground/70">
                {entry.note}
              </p>
            )}

            {entry.href && entry.cta && (
              <Link
                href={entry.href}
                className="group mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-foreground transition-colors hover:text-foreground/70"
              >
                {entry.cta}
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
