import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllCustomerProgress } from "@/lib/murtopolis/queries";
import { sendEmail } from "@/lib/email/resend";
import { siteBaseUrl } from "@/lib/routing/site-url";
import {
  CustomerHealthDigestEmail,
  type CustomerHealthFlagItem,
} from "@/emails/customer-health-digest";

/**
 * Daily customer-health sweep (Vercel cron, see vercel.json).
 *
 * Runs the roadblock flag engine across every external customer, then
 * diffs against `platform_alerts`:
 *   - flags seen for the first time are inserted;
 *   - flags that have cleared are deleted (so a recurrence re-alerts);
 *   - if any NEW warn-severity flags appeared, one digest email goes to
 *     every platform admin. No new warns = no email.
 *
 * Guarded by `Authorization: Bearer ${CRON_SECRET}` - Vercel sends this
 * header automatically for cron invocations when CRON_SECRET is set.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface AlertRow {
  id: string;
  event_id: string;
  flag_key: string;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await getAllCustomerProgress();

  // Flatten to the currently-active flag set.
  const current = customers.flatMap((customer) =>
    customer.events.flatMap((event) =>
      event.flags.map((flag) => ({
        organization_id: customer.orgId,
        event_id: event.eventId,
        flag_key: flag.key,
        message: flag.message,
        severity: flag.severity,
        orgName: customer.orgName,
        eventTitle: event.eventTitle,
      })),
    ),
  );

  const admin = createAdminClient();
  const { data: existingRows, error: readError } = await admin
    .from("platform_alerts")
    .select("id, event_id, flag_key");
  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  const existing = (existingRows ?? []) as AlertRow[];

  const pairKey = (eventId: string, flagKey: string) =>
    `${eventId}:${flagKey}`;
  const existingKeys = new Set(
    existing.map((r) => pairKey(r.event_id, r.flag_key)),
  );
  const currentKeys = new Set(
    current.map((f) => pairKey(f.event_id, f.flag_key)),
  );

  const newFlags = current.filter(
    (f) => !existingKeys.has(pairKey(f.event_id, f.flag_key)),
  );
  const clearedIds = existing
    .filter((r) => !currentKeys.has(pairKey(r.event_id, r.flag_key)))
    .map((r) => r.id);

  if (clearedIds.length > 0) {
    await admin.from("platform_alerts").delete().in("id", clearedIds);
  }

  let insertedIds: { id: string; severity: string }[] = [];
  if (newFlags.length > 0) {
    const { data: inserted, error: insertError } = await admin
      .from("platform_alerts")
      .insert(
        newFlags.map((f) => ({
          organization_id: f.organization_id,
          event_id: f.event_id,
          flag_key: f.flag_key,
          message: f.message,
          severity: f.severity,
        })),
      )
      .select("id, severity");
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    insertedIds = (inserted ?? []) as { id: string; severity: string }[];
  }

  // Digest: new warn-severity flags only.
  const newWarns = newFlags.filter((f) => f.severity === "warn");
  let emailsSent = 0;

  if (newWarns.length > 0) {
    const { data: adminIds } = await admin
      .from("platform_admins")
      .select("user_id");
    const ids = ((adminIds ?? []) as { user_id: string }[]).map(
      (r) => r.user_id,
    );
    const { data: profiles } = ids.length
      ? await admin.from("profiles").select("email").in("id", ids)
      : { data: [] };
    const recipients = ((profiles ?? []) as { email: string }[])
      .map((p) => p.email)
      .filter(Boolean);

    const base = siteBaseUrl();
    const items: CustomerHealthFlagItem[] = newWarns.map((f) => ({
      orgName: f.orgName,
      eventTitle: f.eventTitle,
      message: f.message,
      customerUrl: `${base}/murtopolis/customers/${f.organization_id}`,
    }));

    for (const to of recipients) {
      const result = await sendEmail({
        to,
        subject: `Customer health: ${newWarns.length} new ${newWarns.length === 1 ? "flag" : "flags"}`,
        react: CustomerHealthDigestEmail({ items }),
      });
      if (result.ok && !result.skipped) emailsSent += 1;
    }

    const warnIds = insertedIds
      .filter((r) => r.severity === "warn")
      .map((r) => r.id);
    if (warnIds.length > 0) {
      await admin
        .from("platform_alerts")
        .update({ notified_at: new Date().toISOString() })
        .in("id", warnIds);
    }
  }

  return NextResponse.json({
    customers: customers.length,
    activeFlags: current.length,
    newFlags: newFlags.length,
    newWarnFlags: newWarns.length,
    clearedFlags: clearedIds.length,
    emailsSent,
  });
}
