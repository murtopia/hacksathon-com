import { cache } from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface PlatformAdminContext {
  userId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Gate an API route on "current user is a Murtopolis platform admin."
 *
 * Returns the admin context on success; returns a NextResponse on
 * failure (401 / 403) that the caller can short-circuit return
 * directly. Internally calls the `is_platform_admin` SECURITY DEFINER
 * function - the same helper the platform-scoped RLS policies use -
 * so membership of the `platform_admins` table is the single source of
 * truth for who can reach the owner console.
 */
export async function requirePlatformAdmin(): Promise<
  PlatformAdminContext | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rpc, error: rpcError } = await supabase.rpc(
    "is_platform_admin",
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }
  if (!rpc) {
    return NextResponse.json(
      { error: "Platform admin access required" },
      { status: 403 },
    );
  }

  return { userId: user.id, supabase };
}

export function isErrorResponse(
  value: PlatformAdminContext | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}

/**
 * Boolean platform-admin check for server components (layout gate, the
 * UserMenu link, etc.). Wrapped in React `cache` so the RPC runs at most
 * once per request even when both the layout and the header ask for it.
 * Returns `false` for signed-out users rather than throwing.
 */
export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return Boolean(data);
});
