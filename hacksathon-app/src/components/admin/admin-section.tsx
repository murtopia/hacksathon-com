import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminSectionProps {
  /** Mono numeric prefix shown to the left of the title (e.g. "01"). */
  number: string;
  /** Serif heading - what this section configures. */
  title: string;
  /**
   * Optional editorial intro line shown beneath the title in serif italic.
   * Keep it to one sentence - this is orientation, not documentation.
   */
  intent?: string;
  /** Anchor id, kept around for in-page deep links from the overview. */
  id?: string;
  /** Optional footer - typically a Save row. Rendered below the content. */
  footer?: ReactNode;
  /**
   * Reading width of the section. Defaults to "narrow" (720px,
   * `--container-narrow`) - the project-wide reading-column convention
   * shared by the plan, pricing, and idea pages. Form fields shouldn't
   * stretch the full ~1100px container. Sections that host wide content
   * (roster tables, multi-column grids) pass "wide" to opt back into the
   * full container width.
   */
  width?: "narrow" | "wide";
  children: ReactNode;
}

/**
 * Editorial frame for an admin section. Mirrors the participant
 * `TimelineSection` typography (mono number, serif title, italic intent)
 * so the admin reads as the same product as `/idea`, then hosts the
 * form inside a clean left-rail container.
 *
 * Unlike the participant timeline this is not collapsible - admins need
 * everything visible at once when they're configuring an event.
 */
export function AdminSection({
  number,
  title,
  intent,
  id,
  footer,
  width = "narrow",
  children,
}: AdminSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24",
        width === "narrow" && "max-w-[var(--container-narrow)]",
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-baseline gap-4",
          "max-sm:flex-col max-sm:items-start max-sm:gap-1",
        )}
      >
        <span className="min-w-12 font-mono text-sm font-bold uppercase tracking-wide tabular-nums text-foreground">
          {number}
        </span>
        <h3 className="font-serif text-2xl leading-snug text-foreground">
          {title}
        </h3>
      </header>
      {intent && (
        <p className="mt-1 max-w-[640px] font-serif text-sm italic text-muted-foreground/80">
          {intent}
        </p>
      )}
      <div className="mt-4 ml-4 space-y-4 border-l border-border pl-4 max-sm:ml-0 max-sm:border-l-0 max-sm:pl-0">
        {children}
        {footer && (
          <div className="flex flex-wrap items-center gap-3 pt-2">{footer}</div>
        )}
      </div>
    </section>
  );
}

interface AdminFieldProps {
  /** Mono uppercase label rendered above the input. */
  label: string;
  /** htmlFor / id pairing. */
  htmlFor: string;
  /** Optional serif italic helper line shown beneath the field. */
  hint?: ReactNode;
  /** Optional inline error string (rendered in --text-secondary, not red). */
  error?: string | null;
  children: ReactNode;
  className?: string;
}

/**
 * A labeled form-row inside an `AdminSection`. The label uses the
 * `.mono-label` class - same uppercase 11px JetBrains Mono treatment
 * that appears throughout the participant editorial surfaces.
 */
export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: AdminFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          className="font-serif text-xs italic"
          style={{ color: "var(--text-secondary)" }}
        >
          {error}
        </p>
      ) : hint ? (
        <p className="form-hint font-serif italic">{hint}</p>
      ) : null}
    </div>
  );
}
