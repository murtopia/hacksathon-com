import type { Metadata } from "next";
import Link from "next/link";
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
import {
  AcceptInviteForm,
  AcceptInviteSignedInButton,
} from "@/components/auth/accept-invite-form";
import { isExpired } from "@/lib/invites/tokens";

export const metadata: Metadata = {
  title: "Accept your invite",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Public landing page for invite acceptance.
 *
 * Server-renders the invite + event + org context (admin client used to
 * sidestep RLS, since the recipient has no membership yet). Three
 * render paths:
 *
 *   1. Invite is valid and the visitor isn't signed in → show the
 *      set-password form (`AcceptInviteForm`).
 *   2. Invite is valid and the visitor is already signed in (e.g., they
 *      clicked the link from an existing browser session) → show a
 *      "Join this event" one-click button that POSTs the token without
 *      a password.
 *   3. Invite is missing, expired, revoked, or already accepted → show
 *      a friendly error card with a "Sign in" CTA so the recipient can
 *      still reach the right place.
 */
export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params;
  const decodedToken = decodeURIComponent(token);

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("event_invitations")
    .select(
      "id, event_id, email, status, expires_at, events(id, title, logo_url, organization_id, organizations(name, logo_url))",
    )
    .eq("token", decodedToken)
    .maybeSingle();

  if (!invite) {
    return <InviteError title="Invitation not found" message="This link is invalid or has already been used." />;
  }
  if (invite.status === "revoked") {
    return (
      <InviteError
        title="Invitation revoked"
        message="The organizer revoked this invitation. Ask them for a new one."
      />
    );
  }
  if (invite.status === "accepted") {
    return (
      <InviteError
        title="Already accepted"
        message="You've already joined this event. Sign in to head back to your event home."
        showSignIn
      />
    );
  }
  if (isExpired(invite.expires_at as string)) {
    return (
      <InviteError
        title="Invitation expired"
        message="This invitation has expired. Ask the organizer to send a new one."
      />
    );
  }

  // Pull event + org context for the page header. The relationship
  // types come back as either a single object or an array depending on
  // the response shape - handle both.
  const eventRel = invite.events as
    | EventWithOrg
    | EventWithOrg[]
    | null;
  const eventRow = Array.isArray(eventRel) ? eventRel[0] : eventRel;

  if (!eventRow) {
    return (
      <InviteError
        title="Event missing"
        message="The event for this invitation no longer exists."
      />
    );
  }

  const orgRel = eventRow.organizations as
    | { name: string; logo_url: string | null }
    | { name: string; logo_url: string | null }[]
    | null;
  const org = Array.isArray(orgRel) ? orgRel[0] : orgRel;
  const orgName = org?.name ?? "";
  const logoUrl = eventRow.logo_url ?? org?.logo_url ?? null;

  // Check whether the visitor is already signed in. If they are, show
  // a one-click join CTA instead of the set-password form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // If the signed-in account's email matches the invite, render a
    // one-click join. If it doesn't match, warn them - accepting will
    // bind THIS account, not the invited email's.
    return (
      <SignedInJoin
        token={decodedToken}
        eventId={eventRow.id}
        eventTitle={eventRow.title}
        orgName={orgName}
        logoUrl={logoUrl}
        signedInEmail={user.email ?? ""}
        inviteEmail={String(invite.email)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${orgName || eventRow.title} logo`}
            className="h-10 w-auto max-w-[160px] rounded-md border bg-muted object-contain"
          />
        ) : null}
        <div className="min-w-0">
          {orgName && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {orgName}
            </p>
          )}
          <h1 className="truncate text-lg tracking-tight">
            {eventRow.title}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>You&apos;re in.</CardTitle>
          <CardDescription>
            Set a password and we&apos;ll drop you right into your event home.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm
            token={decodedToken}
            email={String(invite.email)}
            eventTitle={eventRow.title}
          />
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Hacksathon.com
      </p>
    </div>
  );
}

type EventWithOrg = {
  id: string;
  title: string;
  logo_url: string | null;
  organization_id: string;
  organizations:
    | { name: string; logo_url: string | null }
    | { name: string; logo_url: string | null }[]
    | null;
};

function InviteError({
  title,
  message,
  showSignIn = false,
}: {
  title: string;
  message: string;
  showSignIn?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {showSignIn && (
          <CardContent>
            <Button asChild variant="pill" size="pill" className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function SignedInJoin({
  token,
  eventTitle,
  orgName,
  logoUrl,
  signedInEmail,
  inviteEmail,
}: {
  token: string;
  eventId: string;
  eventTitle: string;
  orgName: string;
  logoUrl: string | null;
  signedInEmail: string;
  inviteEmail: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${orgName || eventTitle} logo`}
            className="h-10 w-auto max-w-[160px] rounded-md border bg-muted object-contain"
          />
        ) : null}
        <div className="min-w-0">
          {orgName && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {orgName}
            </p>
          )}
          <h1 className="truncate text-lg tracking-tight">
            {eventTitle}
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Join this event?</CardTitle>
          <CardDescription>
            You&apos;re signed in as{" "}
            <span className="font-medium text-foreground">{signedInEmail}</span>
            . We&apos;ll add this account to {eventTitle}.
            {signedInEmail.toLowerCase() !== inviteEmail.toLowerCase() && (
              <span className="mt-2 block rounded-md border border-amber-300/60 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-200">
                Heads up - the invite was sent to {inviteEmail}. Joining will
                bind the event to your current account, not that address.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteSignedInButton token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
