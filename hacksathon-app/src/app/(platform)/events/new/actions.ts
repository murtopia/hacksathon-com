"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedAwardCategories } from "@/lib/awards/categories";
import { seedReflectionQuestions } from "@/lib/reflections/questions";

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

  // 4. Seed timeline blocks from the default event template so the
  // participant event home has a full 10-block checklist from day one.
  // Failure here doesn't block the redirect — the event home renders
  // gracefully with zero blocks. M6's organizer wizard will let the
  // organizer edit and reschedule these.
  try {
    const { data: template } = await admin
      .from("event_templates")
      .select("blocks")
      .eq("is_default", true)
      .maybeSingle();

    const templateBlocks = Array.isArray(template?.blocks)
      ? (template.blocks as TemplateBlock[])
      : [];

    if (templateBlocks.length > 0) {
      const blockRows = templateBlocks.map((b, index) => ({
        event_id: eventRow.id,
        block_key: b.block_key,
        title: b.title,
        subtitle: b.subtitle ?? null,
        duration_minutes: b.duration_minutes ?? 30,
        description: b.description ?? null,
        purpose: b.purpose ?? null,
        status: "upcoming" as const,
        sort_order: index,
        checklists: b.checklists ?? [],
      }));

      await admin.from("blocks").insert(blockRows);
    }
  } catch {
    // Swallow — the event home tolerates an empty block list.
  }

  // 5. Seed M4 surfaces: 6 award categories (with org-name interpolation)
  // and 7 default reflection questions. Both helpers are idempotent and
  // fail-soft — a participant who never hits +01 or +02 is fine if these
  // didn't seed; the M6 wizard will let organizers customize either set.
  try {
    await Promise.all([
      seedAwardCategories(admin, {
        eventId: eventRow.id,
        orgName,
      }),
      seedReflectionQuestions(admin, { eventId: eventRow.id }),
    ]);
  } catch {
    // Swallow — M4 surfaces tolerate missing seeds.
  }

  redirect(`/events/${eventRow.id}`);
}

type TemplateBlock = {
  block_key: string;
  title: string;
  subtitle?: string;
  duration_minutes?: number;
  description?: string;
  purpose?: string;
  checklists?: unknown[];
};
