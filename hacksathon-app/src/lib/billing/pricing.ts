/**
 * Seat-based pricing for a single Hacks-a-Thon event.
 *
 * Source of truth for the seat -> price math, shared by the checkout UI
 * (display) and the server action that builds the Stripe Checkout
 * Session (authoritative amount). Never trust a client-supplied amount;
 * always recompute here on the server before creating the session.
 *
 * Model (mirrors the public pricing page):
 *   - $995 base, covers up to 25 participants
 *   - +$30 per participant for seats 26..50
 *   - 51+ is not self-serve (contact sales)
 */

export const BASE_PRICE_CENTS = 99_500;
export const INCLUDED_SEATS = 25;
export const PER_EXTRA_SEAT_CENTS = 3_000;
export const MIN_SEATS = 1;
export const MAX_SELF_SERVE_SEATS = 50;

export interface PriceQuote {
  seats: number;
  amountCents: number;
}

/**
 * Compute the price for a seat count. Throws on out-of-range input so
 * callers can surface "contact sales" for 51+ and reject nonsense.
 */
export function priceForSeats(seatsInput: number): PriceQuote {
  const seats = Math.floor(seatsInput);

  if (!Number.isFinite(seats) || seats < MIN_SEATS) {
    throw new Error("Participant count must be at least 1.");
  }
  if (seats > MAX_SELF_SERVE_SEATS) {
    throw new Error(
      `Events over ${MAX_SELF_SERVE_SEATS} participants are custom - contact sales.`,
    );
  }

  const extraSeats = Math.max(0, seats - INCLUDED_SEATS);
  const amountCents = BASE_PRICE_CENTS + extraSeats * PER_EXTRA_SEAT_CENTS;

  return { seats, amountCents };
}

/** Whether a seat count is within the self-serve range. */
export function isSelfServeSeatCount(seatsInput: number): boolean {
  const seats = Math.floor(seatsInput);
  return (
    Number.isFinite(seats) && seats >= MIN_SEATS && seats <= MAX_SELF_SERVE_SEATS
  );
}

/** Format cents as a plain USD string, e.g. 99500 -> "$995". */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  const hasFraction = Math.round(dollars * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(dollars);
}
