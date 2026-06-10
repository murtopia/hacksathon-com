/**
 * Editorial intro shown above the auth card when a visitor arrives via
 * the purchase flow (`?next=/checkout`). Mirrors the homepage hero
 * structure - mono-label eyebrow, serif headline, italic supporting
 * line - and teases that they're one step from buying their event.
 */
export function CheckoutIntro({ mode }: { mode: "signup" | "login" }) {
  const headline =
    mode === "signup"
      ? "Create your account to buy your Hacks-a-Thon."
      : "Log in to buy your Hacks-a-Thon.";

  return (
    <div className="mb-8 text-center">
      <p className="mono-label mb-3">You&apos;re almost there.</p>
      <h1 className="font-serif text-2xl font-normal leading-tight tracking-tight text-foreground sm:text-3xl">
        {headline}
      </h1>
      <p className="mt-4 font-serif text-lg italic leading-snug text-[var(--text-secondary)]">
        Just one quick step before checkout. Set up your account and your
        Hacks-a-Thon is ready to roll.
      </p>
    </div>
  );
}
