import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  CustomerPaymentState,
  HelperPhase,
} from "@/lib/murtopolis/queries";

interface PanelProps {
  /** Mono uppercase section title, e.g. "GROWTH". */
  title: string;
  /** Optional serif-italic orientation line. */
  description?: ReactNode;
  /** Optional right-aligned controls (toolbar, count, etc.). */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * A titled content panel for the owner console. Denser than the
 * per-event `AdminSection` (which is a single reading column) - this is
 * a full-width data surface with a mono header rule.
 */
export function Panel({
  title,
  description,
  actions,
  className,
  children,
}: PanelProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-2">
        <div className="space-y-1">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            {title}
          </h2>
          {description && (
            <p className="font-serif text-sm italic text-muted-foreground/80">
              {description}
            </p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
}

/** Quiet empty state used when a table or list has no rows. */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[4px] border border-dashed px-6 py-12 text-center">
      <p className="font-serif text-base text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

const PAYMENT_VARIANT: Record<
  CustomerPaymentState,
  "default" | "outline" | "secondary"
> = {
  paid: "default",
  comped: "secondary",
  demo: "outline",
  none: "secondary",
};

const PAYMENT_LABEL: Record<CustomerPaymentState, string> = {
  paid: "Paying",
  comped: "Comped",
  demo: "Demo",
  none: "No event",
};

/** Grayscale badge describing a customer's billing state. */
export function PaymentStateBadge({ state }: { state: CustomerPaymentState }) {
  return <Badge variant={PAYMENT_VARIANT[state]}>{PAYMENT_LABEL[state]}</Badge>;
}

const PHASE_VARIANT: Record<HelperPhase, "default" | "outline" | "secondary"> =
  {
    setup: "outline",
    polish: "secondary",
    "run-day": "default",
    "wrap-up": "secondary",
  };

const PHASE_LABEL: Record<HelperPhase, string> = {
  setup: "Setup",
  polish: "Polish",
  "run-day": "Run day",
  "wrap-up": "Wrap-up",
};

/** Badge for the Hacky Helper phase of a customer's event. */
export function PhaseBadge({ phase }: { phase: HelperPhase }) {
  return <Badge variant={PHASE_VARIANT[phase]}>{PHASE_LABEL[phase]}</Badge>;
}
