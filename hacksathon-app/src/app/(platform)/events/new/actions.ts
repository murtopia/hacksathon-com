"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Slug helper — lowercase, ASCII, hyphenated. Suffix logic happens at
 * insert time using the unique constraint, not here, so this is
 * intentionally simple.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * createMinimalEvent — bootstraps the minimum infra required to test
 * IdeaLab end-to-end:
 *   1. organizations row (admin client; RLS allows any authed user
 *      to insert, but slug uniqueness needs collision retry)
 *   2. organization_members row (user as admin, status='active') —
 *      requires admin client because the org has no members yet, so
 *      the standard policy would block the bootstrap.
 *   3. events row with status='active' so /events/[id]/idealab is
 *      immediately reachable.
 *
 * This is intentionally minimal. M6 replaces it with the full
 * organizer wizard (timeline blocks, awards, branding, etc.).
 */
export async function createMinimalEvent(formData: FormData): Promise<
  | { error: string }
  | never
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const orgName = String(formData.get("orgName") ?? "").trim();
  const eventTitle = String(formData.get("eventTitle") ?? "").trim();

  if (!orgName) return { error: "Organization name is required." };
  if (!eventTitle) return { error: "Event title is required." };

  const admin = createAdminClient();

  // 1. Create the organization. Retry on slug collision by appending
  // a short random suffix. Five attempts is plenty for any reasonable
  // collision rate.
  const baseSlug = slugify(orgName) || "team";
  let orgId: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: orgRow, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName, slug })
      .select("id")
      .single();

    if (orgRow) {
      orgId = orgRow.id;
      break;
    }

    if (orgError?.code === "23505") {
      // unique_violation on slug — retry with a suffix
      lastError = orgError.message;
      continue;
    }

    return {
      error: orgError?.message ?? "Failed to create organization.",
    };
  }

  if (!orgId) {
    return { error: lastError ?? "Could not allocate organization slug." };
  }

  // 2. Add the user as the first admin member, immediately active.
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: user.id,
      role: "admin",
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    return { error: memberError.message };
  }

  // 3. Create the event in 'active' status so IdeaLab is reachable.
  // build_platform default 'any' is fine for the M2 stub; M6 will
  // collect this in the wizard.
  const { data: eventRow, error: eventError } = await admin
    .from("events")
    .insert({
      organization_id: orgId,
      title: eventTitle,
      status: "active",
    })
    .select("id")
    .single();

  if (eventError || !eventRow) {
    return { error: eventError?.message ?? "Failed to create event." };
  }

  redirect(`/events/${eventRow.id}/idealab`);
}
