import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface EventAdminContext {
  userId: string;
  eventId: string;
  organizationId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Gate an API route on "current user is an admin of the event's org."
 *
 * Returns the admin context on success; returns a NextResponse on
 * failure (401 / 403 / 404) that the caller can short-circuit return
 * directly. Internally calls the `is_event_admin` SECURITY DEFINER
 * function to avoid recursing through events/organization_members
 * RLS - same pattern the existing RLS policies use.
 */
export async function requireEventAdmin(
  eventId: string,
): Promise<EventAdminContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rpc, error: rpcError } = await supabase.rpc(
    "is_event_admin",
    { p_event_id: eventId },
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }
  if (!rpc) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  const { data: eventRow } = await supabase
    .from("events")
    .select("id, organization_id")
    .eq("id", eventId)
    .maybeSingle<{ id: string; organization_id: string }>();

  if (!eventRow) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return {
    userId: user.id,
    eventId: eventRow.id,
    organizationId: eventRow.organization_id,
    supabase,
  };
}

export function isErrorResponse(
  value: EventAdminContext | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
