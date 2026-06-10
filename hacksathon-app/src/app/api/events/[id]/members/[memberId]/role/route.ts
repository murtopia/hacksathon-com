import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireEventAdmin,
  isErrorResponse,
} from "@/lib/server/event-admin-guard";

export const maxDuration = 10;

const VALID_ROLES = new Set(["admin", "participant"]);

/**
 * Promote / demote a member.
 *
 * Body: { role: 'admin' | 'participant' }
 *
 * Guards:
 *   - admin-only via `requireEventAdmin`
 *   - the target must be an active member of this org
 *   - admins can't change their own role (avoids accidentally locking
 *     themselves out - if they want to step down, another admin has to
 *     do it for them)
 *   - the org always needs at least one admin, so demoting the last
 *     admin is refused with a 409
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { id: eventId, memberId } = await params;
  const ctx = await requireEventAdmin(eventId);
  if (isErrorResponse(ctx)) return ctx;

  let body: { role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = typeof body.role === "string" ? body.role : "";
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json(
      { error: "Role must be 'admin' or 'participant'." },
      { status: 400 },
    );
  }

  if (memberId === ctx.userId) {
    return NextResponse.json(
      {
        error:
          "You can't change your own role. Ask another admin to do it for you.",
      },
      { status: 409 },
    );
  }

  const admin = createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("id, role, status")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", memberId)
    .maybeSingle<{ id: string; role: string; status: string }>();

  if (!member) {
    return NextResponse.json(
      { error: "Member not found in this event." },
      { status: 404 },
    );
  }

  if (member.status !== "active") {
    return NextResponse.json(
      {
        error:
          "Only active members can be promoted or demoted. Approve the request first.",
      },
      { status: 409 },
    );
  }

  if (member.role === role) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // Last-admin guard: if we're demoting an admin, make sure at least
  // one other active admin remains. Cheap count query - the table is
  // tiny in practice.
  if (member.role === "admin" && role === "participant") {
    const { count } = await admin
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .eq("role", "admin")
      .eq("status", "active");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        {
          error:
            "This is the only admin. Promote someone else to admin first.",
        },
        { status: 409 },
      );
    }
  }

  const { error } = await admin
    .from("organization_members")
    .update({ role })
    .eq("id", member.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role });
}
