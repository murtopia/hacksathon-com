import crypto from "node:crypto";

/**
 * Invite-token primitives.
 *
 * Tokens are 32 random bytes encoded base64url - 256 bits of entropy,
 * URL-safe with no padding. They live in `event_invitations.token` and
 * are looked up via the (already-indexed) UNIQUE constraint there.
 *
 * Single-use semantics live in the accept-invite endpoint: it checks
 * status='pending' AND expires_at > now() AND token matches, then
 * flips status='accepted' inside the same transaction.
 */

export const INVITE_TOKEN_BYTES = 32;
export const INVITE_TOKEN_TTL_DAYS = 30;

export function generateInviteToken(): string {
  return crypto.randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}

export function inviteExpiry(daysFromNow = INVITE_TOKEN_TTL_DAYS): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString();
}

export function isExpired(expiresAtIso: string): boolean {
  return new Date(expiresAtIso).getTime() < Date.now();
}

/**
 * Build the absolute accept-invite URL using the configured site URL.
 * Falls back to a relative URL only as a last resort; in production
 * NEXT_PUBLIC_SITE_URL should always be set on Vercel.
 */
export function buildAcceptInviteUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://hacksathon.com";
  const prefix = base.startsWith("http") ? base : `https://${base}`;
  return `${prefix}/accept-invite/${encodeURIComponent(token)}`;
}
