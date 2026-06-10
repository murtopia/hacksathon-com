import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";

export interface JoinPreview {
  eventTitle: string;
  orgName: string;
  logoUrl: string | null;
}

/**
 * If `next` is a `/join/{token}` path with a live token, look up the
 * event + org so auth pages (`/login`, `/signup`) can render contextual
 * "you're about to join X" copy instead of their default "start your
 * own Hacks-a-Thon" framing.
 *
 * Returns null for any of:
 *   - missing / non-join `next`
 *   - malformed path
 *   - revoked token (no matching row)
 *   - DB error
 *
 * Read-only - never writes. Uses the admin client because the visitor
 * is unauthenticated by definition (they're on the auth page).
 */
export async function previewJoinDestination(
  next: string | string[] | undefined,
): Promise<JoinPreview | null> {
  const path =
    typeof next === "string"
      ? next
      : Array.isArray(next)
        ? (next[0] ?? null)
        : null;
  if (!path) return null;

  // Match `/join/{token}` - token is anything URL-safe up to a
  // query/hash boundary. We don't trust the caller; the token still
  // has to resolve in the database below.
  const m = path.match(/^\/join\/([^/?#]+)/);
  if (!m) return null;
  const token = decodeURIComponent(m[1]);
  if (!token) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("events")
      .select("title, logo_url, organizations(name, logo_url)")
      .eq("join_token", token)
      .maybeSingle<{
        title: string;
        logo_url: string | null;
        organizations:
          | { name: string; logo_url: string | null }
          | { name: string; logo_url: string | null }[]
          | null;
      }>();
    if (!data) return null;
    const orgRel = data.organizations;
    const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
    return {
      eventTitle: data.title,
      orgName: org?.name ?? "",
      logoUrl: data.logo_url ?? org?.logo_url ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * If `next` points into a specific event (its first path segment is a
 * live `vanity_slug`, e.g. `/acme` or `/acme/idea`), look up the event +
 * org so the auth pages can render company-specific "this is the sign-in
 * for {company}" copy and branding instead of the generic framing.
 *
 * Returns null for any of:
 *   - missing `next`
 *   - a reserved top-level slug (`/login`, `/checkout`, `/dashboard`, ...)
 *   - no event matching that slug
 *   - DB error
 *
 * Read-only. Uses the admin client because the visitor is unauthenticated
 * on the auth page; this only exposes the same fields the event's public
 * soft-entry page already shows.
 */
export async function previewEventDestination(
  next: string | string[] | undefined,
): Promise<JoinPreview | null> {
  const path =
    typeof next === "string"
      ? next
      : Array.isArray(next)
        ? (next[0] ?? null)
        : null;
  if (!path) return null;

  // First path segment, up to a slash / query / hash boundary.
  const m = path.match(/^\/([^/?#]+)/);
  if (!m) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return null;
  }
  if (!slug || isReservedSlug(slug)) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("events")
      .select("title, logo_url, organizations(name, logo_url)")
      .ilike("vanity_slug", slug)
      .maybeSingle<{
        title: string;
        logo_url: string | null;
        organizations:
          | { name: string; logo_url: string | null }
          | { name: string; logo_url: string | null }[]
          | null;
      }>();
    if (!data) return null;
    const orgRel = data.organizations;
    const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
    return {
      eventTitle: data.title,
      orgName: org?.name ?? "",
      logoUrl: data.logo_url ?? org?.logo_url ?? null,
    };
  } catch {
    return null;
  }
}
