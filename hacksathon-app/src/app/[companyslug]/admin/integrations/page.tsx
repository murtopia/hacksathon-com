import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTeamChatSection } from "@/components/admin/sections/event-team-chat";
import { EventBuildToolSection } from "@/components/admin/sections/event-build-tool";
import { AdminStepNav } from "@/components/admin/admin-step-nav";
import { resolveSlugContext } from "@/lib/routing/slug-context";

export const metadata: Metadata = {
  title: "Integrations",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Integrations admin - the two external systems your event connects
 * to: where participants will chat during the event, and what platform
 * they'll build with. Both are optional but knocking them out makes
 * for a smoother participant experience.
 *
 * Replaces the old "Your event → Branding & access (team chat) +
 * Build tool" footprint by pulling those two sections out of the
 * mixed-purpose tab and giving them their own dedicated space.
 */
export default async function SlugAdminIntegrationsPage({ params }: PageProps) {
  const { companyslug } = await params;
  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const { event } = ctx;
  const settings =
    typeof event.settings === "object" && event.settings
      ? (event.settings as Record<string, unknown>)
      : {};
  const teamChatUrl = (settings.slack_url as string | undefined) ?? null;
  const buildToolConfirmed = Boolean(settings.build_tool_confirmed_at);

  const buildTool = event.build_tool ?? "lovable";

  return (
    <div className="space-y-10">
      <EventTeamChatSection
        number="01"
        eventId={event.id}
        initialTeamChatUrl={teamChatUrl}
        isLocked={event.is_locked}
      />

      <EventBuildToolSection
        number="02"
        eventId={event.id}
        initialBuildTool={buildTool}
        initialConfirmed={buildToolConfirmed}
        isLocked={event.is_locked}
      />

      <AdminStepNav slug={ctx.slug} current="02" />
    </div>
  );
}
