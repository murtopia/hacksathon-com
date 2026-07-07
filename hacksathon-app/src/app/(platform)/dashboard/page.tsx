import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveSlugContext } from "@/lib/routing/slug-context";
import { loadHelperContext } from "@/lib/helper/loader";
import { isPhase1Complete } from "@/lib/helper/phase";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface EventSummary {
  id: string;
  title: string;
  status: string;
  vanity_slug: string | null;
}

/**
 * Platform dashboard.
 *
 * Under the one-org-one-event model the dashboard is a stop-over: the
 * participant's real home is `/[slug]`. We resolve their most-recent
 * event and redirect there immediately; only users with zero events
 * see the "create your first Hacks-a-Thon" empty state.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

  // Resolve "most recent event" by explicit membership rather than
  // leaning on RLS: the events SELECT policy also grants platform
  // admins read access to every event, so an RLS-scoped query would
  // hand a Murtopolis admin the newest event platform-wide (one they
  // aren't a member of) and bounce them into the "private event" loop.
  // Reading membership via the admin client + an explicit org filter
  // keeps this correctly scoped for everyone (same pattern as
  // `resolveSlugViewer`).
  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const orgIds = Array.from(
    new Set(
      ((memberships ?? []) as { organization_id: string }[]).map(
        (m) => m.organization_id,
      ),
    ),
  );

  let primaryEvent: EventSummary | null = null;
  if (orgIds.length > 0) {
    const { data } = await admin
      .from("events")
      .select("id, title, status, vanity_slug")
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<EventSummary>();
    primaryEvent = data ?? null;
  }

  // `primaryEvent` is now the most-recent event the user actually
  // belongs to. Anyone with at least one event jumps straight to it,
  // with one exception: admins whose Phase 1 setup isn't done get
  // routed straight into the admin area so the Hacky Helper is their
  // first touch instead of a half-configured participant home.
  if (primaryEvent?.vanity_slug) {
    const ctx = await resolveSlugContext(primaryEvent.vanity_slug);
    if (ctx) {
      const { data: adminFlag } = await supabase.rpc("is_event_admin", {
        p_event_id: primaryEvent.id,
      });
      if (adminFlag) {
        const helperCtx = await loadHelperContext(ctx);
        if (!isPhase1Complete(helperCtx)) {
          redirect(`/${primaryEvent.vanity_slug}/admin`);
        }
      }
    }
    redirect(`/${primaryEvent.vanity_slug}`);
  }

  // Stragglers: legacy events without a vanity_slug shouldn't exist
  // post-00021 backfill, but route them through the redirect shim
  // anyway so they end up somewhere sensible.
  if (primaryEvent) {
    redirect(`/events/${primaryEvent.id}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome
          {user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center">
        <h2 className="text-lg">
          No Hacks-a-Thon set up yet
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Buy your event and we&apos;ll spin up the timeline, award categories,
          and reflection prompts - then the Hacky Helper walks you through
          setup.
        </p>
        <Button asChild variant="pill" size="pill" className="mt-6">
          <Link href="/checkout">Buy your Hacks-a-Thon</Link>
        </Button>
        <p className="text-muted-foreground mt-4 text-xs">
          Have a promo code? Head to checkout and enter it on the payment
          screen - your total updates before you pay.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your account preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/settings">Open settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
