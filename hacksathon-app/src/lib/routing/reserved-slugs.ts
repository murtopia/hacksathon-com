/**
 * Reserved top-level slugs that vanity URLs must never shadow.
 *
 * The /[companyslug] route is a catch-all at the root of the site, which
 * means a participant landing on /login, /dashboard, /api/foo, etc. would
 * otherwise hit the vanity handler before Next routes them. This set is the
 * short-circuit: if the first path segment is in here, the vanity handler
 * 404s immediately and lets the dedicated route own the URL.
 *
 * Includes every top-level app route plus a few reservations for future
 * platform pages (admin, callback, privacy, terms, case-study, showcase).
 *
 * The M6 organizer wizard's vanity-availability check should also call
 * isReservedSlug() so organizers can't claim an URL we'd then collide with.
 */
export const RESERVED_SLUGS = new Set<string>([
  "api",
  "login",
  "signup",
  "dashboard",
  "events",
  "plan",
  "join",
  "idealab",
  "settings",
  "pricing",
  "checkout",
  "case-study",
  "showcase",
  "the-program",
  "how-it-works",
  "built-for",
  "resources",
  "about",
  "support",
  "waitlist",
  "forgot-password",
  "reset-password",
  "privacy",
  "terms",
  "admin",
  "callback",
  "accept-invite",
  "murtopolis",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
