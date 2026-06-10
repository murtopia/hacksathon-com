import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestToJoinButton } from "@/components/join/request-to-join-button";
import { EventIdentity } from "@/components/join/event-identity";

export const metadata: Metadata = {
  title: "Join an event",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

type EventWithOrg = {
  id: string;
  title: string;
  logo_url: string | null;
  organization_id: string;
  organizations:
    | { name: string; logo_url: string | null; slug: string }
    | { name: string; logo_url: string | null; slug: string }[]
    | null;
};

/**
 * Public landing page for the per-event shareable join link.
 *
 * Token → event (admin client, since the visitor likely has no
 * membership yet). Then branches on the auth state and any existing
 * organization_members row:
 *
 *   - Token missing / disabled            → "no longer active" card.
 *   - Authed, status='active'             → redirect to /{slug}.
 *   - Authed, status='pending'            → "you're in the queue" card.
 *   - Authed, no row (or removed/invited) → "Request to join" CTA.
 *   - Unauthed                            → sign in / create account
 *                                            CTAs preserving the join
 *                                            token in `?next=`.
 */
export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  const decodedToken = decodeURIComponent(token);

  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from("events")
    .select(
      "id, title, logo_url, organization_id, organizations(name, logo_url, slug)",
    )
    .eq("join_token", decodedToken)
    .maybeSingle<EventWithOrg>();

  if (!eventRow) {
    return (
      <JoinShell>
        <Card>
          <CardHeader>
            <CardTitle>Invite link inactive</CardTitle>
            <CardDescription>
              This invite link is no longer active. Reach out to your event
              organizer for a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </JoinShell>
    );
  }

  const orgRel = eventRow.organizations;
  const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
  const orgName = org?.name ?? "";
  const orgSlug = org?.slug ?? null;
  const logoUrl = eventRow.logo_url ?? org?.logo_url ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = `/join/${encodeURIComponent(decodedToken)}`;
    const nextQs = `?next=${encodeURIComponent(nextPath)}`;
    return (
      <JoinShell>
        <EventIdentity
          eventTitle={eventRow.title}
          orgName={orgName}
          logoUrl={logoUrl}
        />
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re invited.</CardTitle>
            <CardDescription>
              <span className="font-serif italic">
                Sign in or create an account to request a spot. An organizer
                will approve new joiners before they appear on the roster.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="pill" size="pill" className="w-full">
              <Link href={`/signup${nextQs}`}>Create account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/login${nextQs}`}>Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </JoinShell>
    );
  }

  // Authenticated - see if the user already has a row in this org.
  const { data: existing } = await admin
    .from("organization_members")
    .select("id, status")
    .eq("organization_id", eventRow.organization_id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; status: string }>();

  if (existing?.status === "active") {
    if (orgSlug) {
      redirect(`/${orgSlug}`);
    }
    redirect("/dashboard");
  }

  if (existing?.status === "pending") {
    return (
      <JoinShell>
        <EventIdentity
          eventTitle={eventRow.title}
          orgName={orgName}
          logoUrl={logoUrl}
        />
        <Card>
          <CardHeader>
            <CardTitle>Request received.</CardTitle>
            <CardDescription>
              <span className="font-serif italic">
                You&apos;ve already requested to join {eventRow.title}. An
                organizer will let you in shortly - we&apos;ll keep your spot
                in the queue.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </JoinShell>
    );
  }

  // No row, or row in 'removed' / 'invited' - let them request.
  return (
    <JoinShell>
      <EventIdentity
        eventTitle={eventRow.title}
        orgName={orgName}
        logoUrl={logoUrl}
      />
      <Card>
        <CardHeader>
          <CardTitle>Welcome.</CardTitle>
          <CardDescription>
            <span className="font-serif italic">
              You&apos;re about to join {eventRow.title}
              {orgName ? ` at ${orgName}` : ""}. We&apos;ll send your request
              to an organizer - once they approve, you&apos;ll land on the
              roster and the event home will open up.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestToJoinButton token={decodedToken} />
        </CardContent>
      </Card>
    </JoinShell>
  );
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      {children}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Hacksathon.com
      </p>
    </div>
  );
}

