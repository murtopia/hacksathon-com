import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Branded campaign short links: /go/<slug> 307-redirects to the
 * destination stored in `short_links` (usually a marketing page with a
 * full UTM query string, so posts and printed materials show a clean
 * URL). Links are managed from the Murtopolis admin's Links tab; the
 * "go" prefix is reserved in reserved-slugs.ts so vanity URLs can't
 * shadow it.
 *
 * 307 (not 308) on purpose: campaigns get re-pointed, and permanent
 * redirects would live on in browser caches.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("short_links")
    .select("destination")
    .eq("slug", slug.toLowerCase())
    .maybeSingle<{ destination: string }>();

  if (!link) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Count the click before redirecting; a fire-and-forget promise can be
  // frozen with the serverless instance before it commits. Never let a
  // counting hiccup break the redirect itself.
  await admin
    .rpc("increment_short_link_clicks", { p_slug: slug.toLowerCase() })
    .then(
      () => undefined,
      () => undefined,
    );

  return NextResponse.redirect(new URL(link.destination, request.url), 307);
}
