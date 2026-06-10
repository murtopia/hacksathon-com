import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Buy your Hacks-a-Thon, then set it up.",
};

/**
 * Purchase-first checkout.
 *
 * Auth is required so the purchase ties to a real account (and the
 * webhook can provision against it). Anonymous visitors are bounced to
 * signup with a return path back here.
 */
export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup?next=/checkout");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="mono-label">Hacksathon.com</p>
          <h1 className="font-serif text-3xl leading-tight">
            Buy your Hacks-a-Thon
          </h1>
          <p className="text-sm text-muted-foreground">
            One flat price for the whole event. Pay now, then set everything up
            with the Hacky Helper guiding you.
          </p>
        </div>

        <CheckoutForm />

        <p className="text-center text-xs text-muted-foreground">
          Questions before you buy?{" "}
          <Link
            href="/pricing"
            className="underline-offset-4 hover:underline"
          >
            See what&apos;s included
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
