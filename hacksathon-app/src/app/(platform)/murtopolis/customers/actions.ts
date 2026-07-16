"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CustomerActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
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
  return { ok: true };
}

/**
 * Mark (or unmark) an organization as a platform test account.
 * Test orgs are hidden from overview metrics and the daily health digest,
 * and only appear under Customers → Billing → Test.
 */
export async function setOrgInternal(
  orgId: string,
  isInternal: boolean,
): Promise<CustomerActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  if (!orgId) return { ok: false, error: "Missing organization id." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({ is_internal: isInternal })
    .eq("id", orgId);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Drop any stored health flags so a re-marked test org does not
  // re-alert from stale rows when later unmarked.
  if (isInternal) {
    await admin.from("platform_alerts").delete().eq("organization_id", orgId);
  }

  revalidatePath("/murtopolis/customers");
  revalidatePath(`/murtopolis/customers/${orgId}`);
  return { ok: true };
}
