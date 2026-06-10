import { createAdminClient } from "@/lib/supabase/admin";
import { siteBaseUrl } from "@/lib/routing/site-url";
import { sendEmail } from "@/lib/email/resend";
import { VotingOpenNotificationEmail } from "@/emails/voting-open-notification";
import { ReflectionsOpenNotificationEmail } from "@/emails/reflections-open-notification";

export type NotifyKind = "voting" | "reflections";

export interface NotifyMembersResult {
  ok: boolean;
  sent: number;
  failed: number;
  recipients: number;
  /** True when Resend isn't configured - nothing was actually delivered. */
  skipped?: boolean;
  error?: string;
}

/** Cap concurrent sends so we don't hammer Resend on large rosters. */
const NOTIFY_CONCURRENCY = 4;

/**
 * Email every active participant that voting / reflections just opened.
 *
 * Recipients are the active `organization_members` of the event's org,
 * joined to `profiles.email` via the admin client (RLS would otherwise
 * scope the roster to the caller). Sends one email per recipient so we
 * never leak the participant list across To/CC.
 */
export async function notifyMembersOpen(
  eventId: string,
  kind: NotifyKind,
): Promise<NotifyMembersResult> {
  const admin = createAdminClient();

  const { data: eventRow, error: eventError } = await admin
    .from("events")
    .select("title, vanity_slug, organization_id, organizations(name)")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return { ok: false, sent: 0, failed: 0, recipients: 0, error: eventError.message };
  }
  if (!eventRow) {
    return { ok: false, sent: 0, failed: 0, recipients: 0, error: "Event not found" };
  }

  const orgRel = eventRow.organizations as
    | { name: string }
    | { name: string }[]
    | null;
  const orgName = Array.isArray(orgRel)
    ? orgRel[0]?.name ?? null
    : orgRel?.name ?? null;
  const eventTitle = (eventRow.title as string | null) ?? "the Hacks-a-Thon";
  const slug = (eventRow.vanity_slug as string | null) ?? "";

  const { data: memberRows, error: memberError } = await admin
    .from("organization_members")
    .select("user_id, profiles!inner(email)")
    .eq("organization_id", eventRow.organization_id as string)
    .eq("status", "active");

  if (memberError) {
    return { ok: false, sent: 0, failed: 0, recipients: 0, error: memberError.message };
  }

  const emails = Array.from(
    new Set(
      (memberRows ?? [])
        .map((m) => {
          const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return (p?.email as string | null)?.trim() ?? null;
        })
        .filter((e): e is string => Boolean(e)),
    ),
  );

  if (emails.length === 0) {
    return { ok: true, sent: 0, failed: 0, recipients: 0 };
  }

  const base = siteBaseUrl();
  const subject =
    kind === "voting"
      ? `Voting is open for the ${eventTitle} Hacky Awards`
      : `Reflections are open for ${eventTitle}`;

  const buildEmail = (recipientEmail: string) =>
    kind === "voting"
      ? VotingOpenNotificationEmail({
          orgName,
          eventTitle,
          votingUrl: `${base}/${slug}/awards`,
          recipientEmail,
        })
      : ReflectionsOpenNotificationEmail({
          orgName,
          eventTitle,
          reflectionsUrl: `${base}/${slug}/reflections`,
          recipientEmail,
        });

  let sent = 0;
  let failed = 0;
  let skipped = false;

  // Simple worker pool: NOTIFY_CONCURRENCY sends in flight at a time.
  let cursor = 0;
  async function worker() {
    while (cursor < emails.length) {
      const email = emails[cursor++];
      const res = await sendEmail({
        to: email,
        subject,
        react: buildEmail(email),
      });
      if (res.ok) {
        sent++;
        if (res.skipped) skipped = true;
      } else {
        failed++;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(NOTIFY_CONCURRENCY, emails.length) }, () =>
      worker(),
    ),
  );

  return {
    ok: true,
    sent,
    failed,
    recipients: emails.length,
    skipped: skipped || undefined,
  };
}
