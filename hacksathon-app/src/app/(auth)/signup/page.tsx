import { Suspense } from "react";
import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { CheckoutIntro } from "@/components/auth/checkout-intro";
import { EventAuthIntro } from "@/components/auth/event-auth-intro";
import { EventIdentity } from "@/components/join/event-identity";
import {
  previewJoinDestination,
  previewEventDestination,
} from "@/lib/join/preview";
import { isCheckoutNext } from "@/lib/auth/checkout-intent";

export const metadata: Metadata = {
  title: "Sign Up",
};

interface PageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

/**
 * Signup page with two voices:
 *
 *   - Default ("start your own"): generic copy for someone hitting
 *     /signup directly from the marketing site.
 *   - Participant ("join an event"): when the visitor arrived via a
 *     join link (`?next=/join/{token}`), surface the event identity
 *     and reframe the copy so they know they're signing up *to join*
 *     a specific event, not to spin up their own.
 */
export default async function SignupPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const joinPreview = await previewJoinDestination(next);
  const checkout = !joinPreview && isCheckoutNext(next);
  const eventPreview =
    !joinPreview && !checkout ? await previewEventDestination(next) : null;

  return (
    <>
      {joinPreview && (
        <EventIdentity
          eventTitle={joinPreview.eventTitle}
          orgName={joinPreview.orgName}
          logoUrl={joinPreview.logoUrl}
        />
      )}
      {checkout && <CheckoutIntro mode="signup" />}
      {eventPreview && (
        <EventAuthIntro
          mode="signup"
          orgName={eventPreview.orgName}
          eventTitle={eventPreview.eventTitle}
          logoUrl={eventPreview.logoUrl}
        />
      )}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {joinPreview ? "Create your account to join" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {joinPreview ? (
              <>
                You&apos;re signing up to join the{" "}
                <span className="font-medium text-foreground">
                  {joinPreview.orgName || joinPreview.eventTitle}
                </span>{" "}
                Hacks-a-Thon. An organizer will approve your request before
                you land on the roster.
              </>
            ) : checkout ? (
              <>Sign up to continue to checkout.</>
            ) : eventPreview ? (
              <>Sign up to continue.</>
            ) : (
              <>Start running Hacks-a-Thons at your company</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64" aria-hidden />}>
            <AuthForm mode="signup" />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}
