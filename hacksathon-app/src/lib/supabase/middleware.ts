import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Roster "Last seen" tracking. Fire-and-forget the throttled RPC so
  // we don't add a network round-trip to every request's critical
  // path; the function no-ops in SQL when the row was already touched
  // within the last minute, so on a hot path this is essentially free.
  // We use `.then(noop, noop)` so unhandled-rejection warnings don't
  // surface if the RPC fails (e.g. during a migration window).
  if (user) {
    const noop = () => {};
    supabase.rpc("touch_my_activity").then(noop, noop);
  }

  const { pathname } = request.nextUrl;

  // Auth gating uses a private-prefix allowlist (everything under the
  // (platform) route group). Everything else - marketing, auth, vanity
  // URLs, invite acceptance, public showcases - is treated as public and
  // the page itself handles auth-aware rendering. This avoids accidentally
  // gating new public routes that get added to the app router.
  const privatePrefixes = [
    "/dashboard",
    "/events",
    "/idealab",
    "/plan",
    "/settings",
    "/murtopolis",
  ];
  const isPrivatePath = privatePrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (
    !user &&
    isPrivatePath &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/callback")
  ) {
    const url = request.nextUrl.clone();
    const returnTo = pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", returnTo);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    // Preserve buy/join intent: an already-authenticated visitor landing
    // on an auth page with `?next=/checkout` (or any safe internal path)
    // should continue there, not get parked on the dashboard.
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next ?? "/dashboard", request.url));
  }

  return supabaseResponse;
}

/**
 * Only ever redirect to a relative path inside this site. Mirrors the
 * sanitization in `AuthForm` so `?next=` can't be used as an open
 * redirect.
 */
function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}
