import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 15;

/**
 * Update organization basics. Org-admin only.
 *
 * Currently scoped to the display `name`. The org `slug` is deliberately
 * not editable here - it appears in URLs (vanity slugs default to it for
 * fresh events) and changing it has wider implications we'll handle in a
 * dedicated rename flow.
 *
 * Auth gate uses the `is_org_admin` SECURITY DEFINER RPC, the same
 * helper the RLS update policy on `organizations` consults - so the
 * route and the database agree on who can write.
 */

interface UpdatePayload {
  name?: string;
}

const NAME_MIN = 2;
const NAME_MAX = 80;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orgId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: isAdminFlag, error: rpcError } = await supabase.rpc(
    "is_org_admin",
    { p_org_id: orgId },
  );
  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }
  if (!isAdminFlag) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  let body: UpdatePayload;
  try {
    body = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
      return NextResponse.json(
        {
          error: `Company name must be between ${NAME_MIN} and ${NAME_MAX} characters.`,
        },
        { status: 400 },
      );
    }
    updates.name = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("organizations")
    .update(updates)
    .eq("id", orgId)
    .select("id, name, slug, logo_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, organization: updated });
}
