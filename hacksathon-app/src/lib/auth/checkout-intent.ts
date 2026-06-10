/**
 * True when an auth page's `next` param points at the purchase flow
 * (`/checkout`). Used by `/login` and `/signup` to swap in the warmer
 * "you're almost there" checkout intro instead of the default copy.
 *
 * Matches `/checkout` exactly (allowing a trailing query/hash) so the
 * post-payment return `/checkout/success` is intentionally excluded.
 */
export function isCheckoutNext(
  next: string | string[] | undefined,
): boolean {
  const path =
    typeof next === "string"
      ? next
      : Array.isArray(next)
        ? (next[0] ?? null)
        : null;
  if (!path) return false;

  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // Leave `decoded` as the raw value if it isn't valid encoding.
  }

  return /^\/checkout(?:[?#]|$)/.test(decoded);
}
