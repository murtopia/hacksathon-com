"use client";

import { useMemo, useState, useTransition } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnalyticsEvent } from "@/lib/analytics/events";
import {
  priceForSeats,
  isSelfServeSeatCount,
  formatUsd,
  MAX_SELF_SERVE_SEATS,
} from "@/lib/billing/pricing";
import { createCheckoutSession } from "./actions";

export function CheckoutForm() {
  const [seatCount, setSeatCount] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const quote = useMemo(() => {
    const n = Number(seatCount);
    if (!Number.isFinite(n) || n < 1) return null;
    if (!isSelfServeSeatCount(n)) return "over";
    try {
      return priceForSeats(n);
    } catch {
      return null;
    }
  }, [seatCount]);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const seats = Number(seatCount);
      posthog.capture(AnalyticsEvent.CheckoutStarted, {
        seat_count: Number.isFinite(seats) ? seats : null,
        amount_cents:
          quote && quote !== "over" ? quote.amountCents : null,
      });
      // Hand off to Stripe's hosted checkout.
      window.location.href = result.url;
    });
  }

  const overLimit = quote === "over";
  const priceLabel =
    quote && quote !== "over" ? formatUsd(quote.amountCents) : null;

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="orgName">Company or team name</Label>
        <Input
          id="orgName"
          name="orgName"
          placeholder="e.g. Acme Co."
          required
          disabled={isPending}
        />
        <p className="form-hint">
          This names your workspace and your event&apos;s web address. You can
          fine-tune everything during setup.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="seatCount">How many people do you expect?</Label>
        <Input
          id="seatCount"
          name="seatCount"
          type="number"
          min={1}
          max={MAX_SELF_SERVE_SEATS}
          step={1}
          value={seatCount}
          onChange={(e) => setSeatCount(e.target.value)}
          required
          disabled={isPending}
          className="max-w-[8rem]"
        />
        <p className="form-hint">
          $995 covers up to 25 people, then $30 per additional participant (up
          to {MAX_SELF_SERVE_SEATS}).
        </p>
      </div>

      <div className="rounded-md border p-4">
        {overLimit ? (
          <p className="form-hint">
            Running this for more than {MAX_SELF_SERVE_SEATS} people? Email{" "}
            <a
              href="mailto:support@hacksathon.com"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              support@hacksathon.com
            </a>{" "}
            for a custom quote.
          </p>
        ) : (
          <div className="flex items-baseline justify-between">
            <span className="mono-label">Total today</span>
            <span className="font-serif text-3xl">{priceLabel ?? "-"}</span>
          </div>
        )}
      </div>

      <p className="form-hint">
        Covers the Hacksathon platform for your whole event. AI build tools
        (Lovable, Cursor, v0, Google AI Studio, and others) are separate and
        aren&apos;t included - many teams already have one through their
        company plan.
      </p>

      {error && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="submit"
          variant="pill"
          size="pill"
          className="w-full"
          disabled={isPending || overLimit}
        >
          {isPending ? "Starting checkout…" : "Continue to payment"}
        </Button>
        <p className="form-hint text-center">
          Secure checkout by Stripe. Have a promo code? Enter it on the next
          screen - your total updates before you&apos;re charged.
        </p>
      </div>
    </form>
  );
}
