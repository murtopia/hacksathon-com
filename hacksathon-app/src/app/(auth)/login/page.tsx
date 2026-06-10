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
  title: "Log In",
};

interface PageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

/**
 * Login page. Mirrors signup: when the visitor arrived via a join link
 * (`?next=/join/{token}`), surface the event identity and reframe the
 * copy so an existing user lands on the right context instead of the
 * generic "Welcome back" greeting.
 */
export default async function LoginPage({ searchParams }: PageProps) {
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
      {checkout && <CheckoutIntro mode="login" />}
      {eventPreview && (
        <EventAuthIntro
          mode="login"
          orgName={eventPreview.orgName}
          eventTitle={eventPreview.eventTitle}
          logoUrl={eventPreview.logoUrl}
        />
      )}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {joinPreview ? "Log in to join" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {joinPreview ? (
              <>
                Sign in to request a spot in the{" "}
                <span className="font-medium text-foreground">
                  {joinPreview.orgName || joinPreview.eventTitle}
                </span>{" "}
                Hacks-a-Thon.
              </>
            ) : checkout ? (
              <>Log in to continue to checkout.</>
            ) : eventPreview ? (
              <>Log in to continue.</>
            ) : (
              <>Log in to your Hacksathon.com account</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64" aria-hidden />}>
            <AuthForm mode="login" />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}
