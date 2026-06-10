import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/signout
 *
 * Clears the current session and bounces the user back to the
 * marketing root.
 *
 * Why status 303 (See Other) instead of the NextResponse default 307:
 * a 307 preserves the request method, so the browser would follow the
 * redirect with another POST to "/" - which is a GET-only page and
 * returns 405. 303 explicitly tells the browser to switch to GET when
 * following, which is the standard pattern for POST-then-redirect.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;

  return NextResponse.redirect(new URL("/", origin), { status: 303 });
}
