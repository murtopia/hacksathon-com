/**
 * Company-context intro for the auth pages when a visitor arrives headed
 * for a specific event (`?next=/{slug}`). Mirrors the checkout intro
 * (centered eyebrow + serif headline + italic supporting line) but adds
 * the event logo and a note that this sign-in belongs to the event's
 * organization, with a pointer to the organizer for access (the
 * private-event caveat).
 */
export function EventAuthIntro({
  mode,
  orgName,
  eventTitle,
  logoUrl,
}: {
  mode: "login" | "signup";
  orgName: string | null;
  eventTitle: string;
  logoUrl: string | null;
}) {
  const name = orgName?.trim() || eventTitle;
  const note =
    mode === "login"
      ? `This is the sign-in for ${name} accounts. Need access? Ask your event organizer for an invite.`
      : `Set up your account for the ${eventTitle}. Need access? Ask your event organizer for an invite.`;

  return (
    <div className="mb-8 text-center">
      <div className="mb-4 flex justify-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="h-12 w-auto min-w-[48px] max-w-[192px] rounded-md border bg-muted object-contain"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-lg font-semibold text-muted-foreground"
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      {orgName?.trim() && <p className="mono-label mb-3">{orgName}</p>}
      <h1 className="font-serif text-2xl font-normal leading-tight tracking-tight text-foreground sm:text-3xl">
        {eventTitle}
      </h1>
      <p className="mx-auto mt-4 max-w-sm font-serif text-lg italic leading-snug text-[var(--text-secondary)]">
        {note}
      </p>
    </div>
  );
}
