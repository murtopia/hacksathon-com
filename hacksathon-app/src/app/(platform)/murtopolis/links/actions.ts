"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";

export interface ShortLinkActionResult {
  ok: boolean;
  error?: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Shared gate for the Links tab's server actions: same platform-admin
 * re-check the emails tab's sendTestEmails performs, so a stale client
 * can never mutate links after access is revoked.
 */
async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: isAdmin, error } = await supabase.rpc("is_platform_admin");
  if (error || !isAdmin) {
    return { ok: false, error: "Platform admin access required." };
  }
  return { ok: true, userId: user.id };
}

/**
 * Validate a destination: either an absolute path on our own site
 * ("/seven2?utm_...") or a full http(s) URL. Returns the normalized
 * value or null when invalid.
 */
function normalizeDestination(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function createShortLink(
  slugRaw: string,
  destinationRaw: string,
): Promise<ShortLinkActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const slug = slugRaw.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error:
        "Slug must be lowercase letters, numbers, and hyphens (e.g. agency-launch).",
    };
  }
  // "go" itself is reserved for the namespace; individual slugs only need
  // to avoid colliding with each other, but reject reserved words anyway
  // so /go/admin and friends stay unambiguous.
  if (isReservedSlug(slug)) {
    return { ok: false, error: `"${slug}" is a reserved word.` };
  }

  const destination = normalizeDestination(destinationRaw);
  if (!destination) {
    return {
      ok: false,
      error:
        "Destination must be a full URL (https://...) or a site path starting with /.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("short_links").insert({
    slug,
    destination,
    created_by: gate.userId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `/go/${slug} already exists.` };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/murtopolis/links");
  return { ok: true };
}

export async function deleteShortLink(
  id: string,
): Promise<ShortLinkActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false, error: gate.error };

  const admin = createAdminClient();
  const { error } = await admin.from("short_links").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/murtopolis/links");
  return { ok: true };
}
