/**
 * Resolve the absolute, public base URL for the app.
 *
 * Order of preference:
 *   1. NEXT_PUBLIC_APP_URL  (explicit canonical, e.g. https://hacksathon.com)
 *   2. NEXT_PUBLIC_SITE_URL (legacy alias, still used by join/invite tokens)
 *   3. NEXT_PUBLIC_VERCEL_URL (preview deploys - host only, no scheme)
 *   4. https://hacksathon.com (last-resort production default)
 *
 * Always returns a scheme-prefixed origin with no trailing slash.
 */
export function siteBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "https://hacksathon.com";
  return base.startsWith("http") ? base : `https://${base}`;
}
