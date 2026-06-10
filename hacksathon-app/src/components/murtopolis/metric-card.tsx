import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  /** Mono uppercase label, e.g. "Total revenue". */
  label: string;
  /** The headline figure - already formatted (string) or a number. */
  value: ReactNode;
  /** Optional secondary line beneath the value (serif italic). */
  hint?: ReactNode;
  /** Optional small mono tag in the top-right, e.g. "30d". */
  tag?: string;
  className?: string;
}

/**
 * A single KPI tile for the Murtopolis overview. Follows the grayscale
 * editorial system: mono label, oversized serif number, serif-italic
 * hint. No color, no shadow - just a quiet bordered cell that reads as
 * one item in a data grid.
 */
export function MetricCard({
  label,
  value,
  hint,
  tag,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[4px] border p-4",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="mono-label"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
        {tag && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {tag}
          </span>
        )}
      </div>
      <span className="font-serif text-3xl leading-none tabular-nums text-foreground">
        {value}
      </span>
      {hint && (
        <span className="font-serif text-xs italic text-muted-foreground/80">
          {hint}
        </span>
      )}
    </div>
  );
}
