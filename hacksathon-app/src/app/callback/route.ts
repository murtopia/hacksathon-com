import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next ?? "/dashboard"}`);
    }
  }

  // Auth failed. Keep `next` on the login URL so a retry still lands the
  // user where they were headed (e.g. /checkout), and flag the error so
  // the login page can explain what happened instead of looping silently.
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  if (next) loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

/**
 * Only ever redirect to a relative path inside this site. Mirrors the
 * sanitization in `AuthForm` and the middleware so `?next=` can't be
 * used as an open redirect.
 */
function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}
