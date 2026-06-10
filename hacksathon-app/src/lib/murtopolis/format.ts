/**
 * Formatting helpers for the Murtopolis owner console. Kept tiny and
 * dependency-free; currency is whole-dollar (we never charge fractional
 * dollars) so cents round to the nearest dollar for display.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat("en-US");

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatCurrencyFromCents(
  cents: number | null | undefined,
): string {
  return USD.format(Math.round((cents ?? 0) / 100));
}

export function formatNumber(value: number | null | undefined): string {
  return NUMBER.format(value ?? 0);
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  return DATE.format(d);
}

/** Friendly label for the per-event payment status enum. */
export function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "completed":
      return "Completed";
    case "refunded":
      return "Refunded";
    case "comped":
      return "Comped (promo)";
    case "demo":
      return "Demo";
    default:
      return status ?? "-";
  }
}
