import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTitleSection } from "@/components/admin/sections/event-title";
import { EventWelcomeSection } from "@/components/admin/sections/event-welcome";
import { EventLogoSection } from "@/components/admin/sections/event-logo";
import { EventVanityUrlSection } from "@/components/admin/sections/event-vanity-url";
import { OrgBasicsSection } from "@/components/admin/sections/org-basics";
import { resolveSlugContext } from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Identity",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Identity admin - everything that answers "what is this event, and
 * where does it live?" Five sections in journey order: company → event
 * title → welcome → logo → vanity URL. Replaces the old "Company
 * settings → 01 Company" + "Your event → 01/02/03" split that forced
 * admins to context-switch tabs to compose a single sentence.
 *
 * Auth gated by the admin layout.
 */
export default async function SlugAdminIdentityPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const { event, org } = ctx;

  const settings =
    typeof event.settings === "object" && event.settings
      ? (event.settings as Record<string, unknown>)
      : {};
  const vanityConfirmed = Boolean(settings.vanity_confirmed_at);

  return (
    <div className="space-y-10">
      {org && (
        <OrgBasicsSection
          number="01"
          orgId={org.id}
          initialName={org.name}
        />
      )}

      <EventTitleSection
        number="02"
        eventId={event.id}
        initialTitle={event.title}
        isLocked={event.is_locked}
      />

      <EventWelcomeSection
        number="03"
        eventId={event.id}
        initialWelcomeMessage={event.welcome_message ?? ""}
        initialWelcomeVideoUrl={event.welcome_video_url ?? ""}
        isLocked={event.is_locked}
      />

      <EventLogoSection
        number="04"
        eventId={event.id}
        initialLogoUrl={event.logo_url}
        fallbackName={org?.name ?? event.title}
        isLocked={event.is_locked}
      />

      <EventVanityUrlSection
        number="05"
        eventId={event.id}
        initialVanitySlug={event.vanity_slug}
        initialConfirmed={vanityConfirmed}
        isLocked={event.is_locked}
      />
    </div>
  );
}
