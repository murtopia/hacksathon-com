/**
 * Compact event identity header - org logo + event title. The org name
 * is deliberately not repeated as text: most logos and event titles
 * already carry it, so a third mention read as clutter.
 *
 * Used wherever a participant lands "in the context of joining a
 * specific event": the /join/[token] page itself plus the /login and
 * /signup pages when they receive a ?next=/join/{token} hand-off.
 */
export function EventIdentity({
  eventTitle,
  orgName,
  logoUrl,
}: {
  eventTitle: string;
  orgName: string;
  logoUrl: string | null;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${orgName || eventTitle} logo`}
          className="h-10 w-auto max-w-[160px] object-contain"
        />
      ) : null}
      <h1 className="min-w-0 truncate text-lg tracking-tight">
        {eventTitle}
      </h1>
    </div>
  );
}
