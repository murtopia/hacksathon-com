import crypto from "node:crypto";

/**
 * Join-link token primitives.
 *
 * Tokens are 32 random bytes encoded base64url - 256 bits of entropy,
 * URL-safe with no padding. They live in `events.join_token` (UNIQUE
 * partial index in migration 00025) and are looked up directly when a
 * visitor hits /join/{token}.
 *
 * Unlike `event_invitations.token` these are durable: the same token
 * remains valid until an admin rotates or revokes it. There's no
 * expires_at - admins control the lifecycle.
 */

export const JOIN_TOKEN_BYTES = 32;

export function generateJoinToken(): string {
  return crypto.randomBytes(JOIN_TOKEN_BYTES).toString("base64url");
}

/**
 * Build the absolute join URL using the configured site URL.
 * Falls back to a relative URL only as a last resort; in production
 * NEXT_PUBLIC_SITE_URL should always be set on Vercel.
 */
export function buildJoinUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://hacksathon.com";
  const prefix = base.startsWith("http") ? base : `https://${base}`;
  return `${prefix}/join/${encodeURIComponent(token)}`;
}
