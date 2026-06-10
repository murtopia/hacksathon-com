/**
 * Lightweight, dependency-free rate limiter for public API routes.
 *
 * Uses an in-process fixed-window counter keyed by an arbitrary string
 * (typically `routeName:clientIp`). On Vercel Fluid Compute, function
 * instances are reused across many requests, so an in-memory counter
 * meaningfully raises the bar against single-source abuse (form
 * flooding, email-quota burn, enumeration sweeps).
 *
 * Caveat: counters are per-instance, not shared across regions or
 * concurrent instances. For hard, globally-consistent limits (e.g. login
 * brute-force protection), back this with a shared store such as Upstash
 * Redis by swapping the `hit` implementation. The public-facing,
 * abuse-reduction use cases here do not require that guarantee.
 */

interface WindowState {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowState>();

// Bound memory by sweeping expired windows periodically. Cheap because
// the map only holds active keys within the current window.
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, state] of store) {
    if (state.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Unique key for the caller, e.g. `support:1.2.3.4`. */
  key: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when `ok` is false). */
  retryAfterSeconds: number;
  remaining: number;
}

export function rateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const state = store.get(key);

  if (!state || state.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0, remaining: limit - 1 };
  }

  if (state.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  state.count += 1;
  return {
    ok: true,
    retryAfterSeconds: 0,
    remaining: limit - state.count,
  };
}

/**
 * Best-effort client IP extraction from a Request. Behind Vercel the
 * left-most entry of `x-forwarded-for` is the original client. Falls back
 * to a constant so a missing header degrades to a shared bucket (still
 * rate-limited, just coarser) rather than disabling the limit entirely.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
