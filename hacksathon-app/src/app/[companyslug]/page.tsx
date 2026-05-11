import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";

export const metadata: Metadata = {
  title: "Event",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

interface VanityEventRow {
  id: string;
  title: string;
  logo_url: string | null;
  welcome_message: string | null;
  organization_id: string;
  vanity_slug: string;
}

interface OrgRow {
  name: string;
  logo_url: string | null;
}

/**
 * Vanity URL landing for during-event participation.
 *
 * Flow:
 *   1. Reject reserved slugs immediately (notFound) so app routes never
 *      get shadowed by this catch-all.
 *   2. Look up the event by vanity_slug. Use the admin client because
 *      anonymous visitors don't have RLS access to private events but
 *      we still want to render a branded sign-in card.
 *   3. If signed in and a member → redirect to /events/[id].
 *   4. If signed in but not a member → private-event message.
 *   5. If not signed in → branded card with sign-in CTA carrying
 *      next=/events/[id].
 *
 * After publish (deferred polish) this same URL renders the public
 * results page; for now it's strictly a during-event soft entry point.
 */
export default async function VanityCompanyPage({ params }: PageProps) {
  const { companyslug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  if (isReservedSlug(slug)) notFound();

  // Use the admin client for the public lookup — anonymous visitors need
  // to see the branded sign-in card, but our `events` RLS would
  // (correctly) hide private events from non-members. We only expose
  // identity fields (title, logo, welcome copy) below.
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select(
      "id, title, logo_url, welcome_message, organization_id, vanity_slug",
    )
    .ilike("vanity_slug", slug)
    .maybeSingle<VanityEventRow>();

  if (!event) notFound();

  const { data: org } = await admin
    .from("organizations")
    .select("name, logo_url")
    .eq("id", event.organization_id)
    .maybeSingle<OrgRow>();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Signed in + member → straight to the event home.
  if (user) {
    const { data: membership } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      redirect(`/events/${event.id}`);
    }

    // 4. Signed in but not a member.
    return (
      <VanityShell
        logoUrl={event.logo_url ?? org?.logo_url ?? null}
        orgName={org?.name ?? null}
        title={event.title}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This is a private event</CardTitle>
            <CardDescription>
              You&apos;re signed in, but you&apos;re not a member of this event yet.
              Ask your organizer for an invite link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </VanityShell>
    );
  }

  // 5. Anonymous visitor — branded card with sign-in CTA carrying next.
  const next = `/events/${event.id}`;
  return (
    <VanityShell
      logoUrl={event.logo_url ?? org?.logo_url ?? null}
      orgName={org?.name ?? null}
      title={event.title}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Welcome.</CardTitle>
          <CardDescription>
            {event.welcome_message?.trim() ||
              "Sign in to jump back into your hackathon."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/signup?next=${encodeURIComponent(next)}`}>
              Create account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </VanityShell>
  );
}

/**
 * Shared chrome for the vanity landing page. Centers a stack of:
 * logo → org/event title → child card. Independent of the (platform)
 * shell because this route sits outside the auth-gated app surface.
 */
function VanityShell({
  logoUrl,
  orgName,
  title,
  children,
}: {
  logoUrl: string | null;
  orgName: string | null;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          {logoUrl ? (
            <div className="h-16 w-16 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${orgName ?? title} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted text-xl font-semibold text-muted-foreground"
            >
              {(orgName ?? title).slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="space-y-1">
          {orgName && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {orgName}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="text-left">{children}</div>
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline-offset-4 hover:underline">
            Hacksathon.com
          </Link>
        </p>
      </div>
    </div>
  );
}
