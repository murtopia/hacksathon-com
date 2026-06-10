import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";
import { maybeAutoTransitionVoting } from "@/lib/voting/auto-transition";
import { maybeAutoTransitionReflections } from "@/lib/reflections/auto-transition";

/**
 * Shared slug → event/org/membership resolution for every page under
 * `/[companyslug]/*`.
 *
 * Two responsibilities:
 *   1. Slug-to-event lookup (anonymous safe via admin client, since the
 *      page may render for non-members in the showcase / sign-in paths).
 *   2. Membership + admin checks for the current request's user.
 *
 * Both are wrapped in React's `cache()` so multiple components in the
 * same render tree (layout, page, nav, etc.) share one DB round trip.
 *
 * Convention: layouts/pages that need the data call
 * `resolveSlugContext(slug)` first; if it returns `null` they `notFound()`.
 * Authenticated routes additionally call `resolveSlugViewer(slug)` to get
 * the user + membership/admin flags for the same request.
 */

export interface SlugEvent {
  id: string;
  title: string;
  description: string | null;
  status: string;
  welcome_message: string | null;
  welcome_video_url: string | null;
  logo_url: string | null;
  vanity_slug: string;
  organization_id: string;
  settings: Record<string, unknown> | null;
  voting_status: "closed" | "open" | "revealed";
  voting_open_at: string | null;
  voting_close_at: string | null;
  results_published_at: string | null;
  reflection_status: "closed" | "open" | "complete";
  reflections_open_at: string | null;
  reflections_close_at: string | null;
  is_locked: boolean;
  public_showcase: boolean;
  reflection_summary: string | null;
  reflection_summary_generated_at: string | null;
  reflection_summary_approved_at: string | null;
  created_at: string;
  build_tool: string;
}

export interface SlugOrg {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface SlugContext {
  slug: string;
  event: SlugEvent;
  org: SlugOrg | null;
}

const EVENT_COLUMNS =
  "id, title, description, status, welcome_message, welcome_video_url, logo_url, vanity_slug, organization_id, settings, voting_status, voting_open_at, voting_close_at, results_published_at, reflection_status, reflections_open_at, reflections_close_at, is_locked, public_showcase, reflection_summary, reflection_summary_generated_at, reflection_summary_approved_at, created_at, build_tool";

/**
 * Resolve a slug to its event + organization rows. Returns null when
 * the slug is reserved or no event has it (caller should `notFound()`).
 *
 * Uses the admin client deliberately: anonymous showcase visitors don't
 * have RLS read access to events, and the slug-resolution itself
 * exposes only the fields we'd otherwise expose on the public showcase.
 */
export const resolveSlugContext = cache(
  async (rawSlug: string): Promise<SlugContext | null> => {
    const slug = rawSlug.toLowerCase();
    if (isReservedSlug(slug)) return null;

    const admin = createAdminClient();
    const { data: event } = await admin
      .from("events")
      .select(EVENT_COLUMNS)
      .ilike("vanity_slug", slug)
      .maybeSingle<SlugEvent>();

    if (!event) return null;

    // Lazy voting-window check: if the admin scheduled a window and
    // the clock has crossed it, flip voting_status here before any
    // caller reads it. Idempotent; safe to run on every render.
    const postTransitionStatus = await maybeAutoTransitionVoting({
      id: event.id,
      voting_status: event.voting_status,
      voting_open_at: event.voting_open_at,
      voting_close_at: event.voting_close_at,
    });
    if (postTransitionStatus !== event.voting_status) {
      event.voting_status = postTransitionStatus;
      if (postTransitionStatus === "revealed") event.is_locked = true;
    }

    // Lazy reflection-window check (status flip only - no LLM on render).
    const postReflectionStatus = await maybeAutoTransitionReflections({
      id: event.id,
      reflection_status: event.reflection_status,
      reflections_open_at: event.reflections_open_at,
      reflections_close_at: event.reflections_close_at,
    });
    if (postReflectionStatus !== event.reflection_status) {
      event.reflection_status = postReflectionStatus;
    }

    const { data: org } = await admin
      .from("organizations")
      .select("id, name, slug, logo_url")
      .eq("id", event.organization_id)
      .maybeSingle<SlugOrg>();

    return { slug, event, org: org ?? null };
  },
);

export interface SlugViewer {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  isMember: boolean;
  isAdmin: boolean;
}

/**
 * Resolve the current request's user + their relationship to the event
 * at this slug. Returns null when no user is signed in.
 *
 * Membership is read via the admin client because the
 * organization_members SELECT policy is intentionally narrow (callers
 * only see their own row); pulling it via admin sidesteps the RLS
 * round-trip on non-member visitors too.
 */
export const resolveSlugViewer = cache(
  async (slug: string): Promise<SlugViewer | null> => {
    const ctx = await resolveSlugContext(slug);
    if (!ctx) return null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();
    const [
      { data: membership },
      { data: profile },
      { data: isAdminFlag },
    ] = await Promise.all([
      admin
        .from("organization_members")
        .select("role, status")
        .eq("organization_id", ctx.event.organization_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle<{ role: string; status: string }>(),
      admin
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle<{ full_name: string | null; avatar_url: string | null }>(),
      supabase.rpc("is_event_admin", { p_event_id: ctx.event.id }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      },
      isMember: Boolean(membership),
      isAdmin: Boolean(isAdminFlag),
    };
  },
);

/**
 * Convenience: build the canonical absolute path for a slug-scoped
 * route. Centralizes the `/[slug]/...` prefix so we don't sprinkle
 * string interpolation across components.
 */
export function slugPath(slug: string, subpath: string = ""): string {
  const trimmed = subpath.startsWith("/") ? subpath.slice(1) : subpath;
  return trimmed ? `/${slug}/${trimmed}` : `/${slug}`;
}

/**
 * Resolve a UUID-based event id to its vanity_slug. Used by the
 * legacy `/events/[id]/*` redirect shims. Returns null when no event
 * exists for the id (caller `notFound()`s).
 */
export const resolveEventSlug = cache(
  async (eventId: string): Promise<string | null> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("events")
      .select("vanity_slug")
      .eq("id", eventId)
      .maybeSingle<{ vanity_slug: string | null }>();
    return data?.vanity_slug ?? null;
  },
);
