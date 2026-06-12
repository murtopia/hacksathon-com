import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { formatUsd } from "@/lib/billing/pricing";
import { siteBaseUrl } from "@/lib/routing/site-url";
import { PurchaseWelcomeEmail } from "@/emails/purchase-welcome";
import { PurchaseNotificationEmail } from "@/emails/purchase-notification";

/** Internal recipient for new-purchase heads-up notifications. */
const INTERNAL_NOTIFY_EMAIL =
  process.env.INTERNAL_NOTIFY_EMAIL ?? "nick@seven2.com";

export interface PurchaseWelcomeParams {
  userId: string;
  orgName: string;
  eventTitle: string;
  /** Event vanity slug - used to build the admin URL. */
  slug: string;
  seatLimit: number;
  /** Actual amount charged (Stripe `amount_total`). null/0 => free. */
  amountTotalCents: number | null;
  discountCode: string | null;
}

/**
 * Branded purchase confirmation + welcome email for the buyer/admin.
 *
 * Fully fail-soft: resolves the recipient and sends best-effort, never
 * throwing. Callers (webhook + success page) must not let email failures
 * block provisioning, the redirect, or a webhook 200.
 */
export async function sendPurchaseWelcomeEmail(
  params: PurchaseWelcomeParams,
): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: authData } = await admin.auth.admin.getUserById(
      params.userId,
    );
    const email = authData?.user?.email ?? null;
    if (!email) {
      console.warn(
        "[email] purchase-welcome: no email for user",
        params.userId,
      );
      return;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", params.userId)
      .maybeSingle<{ full_name: string | null }>();

    const adminName =
      profile?.full_name?.trim() ||
      (typeof authData?.user?.user_metadata?.full_name === "string"
        ? authData.user.user_metadata.full_name.trim()
        : "") ||
      null;

    const isFree =
      params.amountTotalCents === null || params.amountTotalCents <= 0;
    const amountLabel = isFree
      ? params.discountCode
        ? `Free (promo ${params.discountCode})`
        : "Free"
      : formatUsd(params.amountTotalCents as number);

    const adminUrl = `${siteBaseUrl()}/${params.slug}/admin`;

    await sendEmail({
      to: email,
      subject: `Your ${params.orgName} Hacks-a-Thon is ready`,
      react: PurchaseWelcomeEmail({
        adminName,
        orgName: params.orgName,
        eventTitle: params.eventTitle,
        seatLimit: params.seatLimit,
        amountLabel,
        adminUrl,
        recipientEmail: email,
      }),
    });

    // Internal heads-up to the operator. Independent and fail-soft so a
    // notification failure never affects the buyer's welcome or the
    // webhook 200. Reply-to is the buyer so replies reach the customer.
    try {
      await sendEmail({
        to: INTERNAL_NOTIFY_EMAIL,
        subject: `New purchase - ${params.orgName} (${amountLabel})`,
        replyTo: email,
        react: PurchaseNotificationEmail({
          buyerName: adminName,
          buyerEmail: email,
          orgName: params.orgName,
          eventTitle: params.eventTitle,
          seatLimit: params.seatLimit,
          amountLabel,
          discountCode: params.discountCode,
          slug: params.slug,
          adminUrl,
        }),
      });
    } catch (e) {
      console.error(
        "[email] purchase-notification send failed (non-fatal):",
        e,
      );
    }
  } catch (e) {
    console.error("[email] purchase-welcome send failed (non-fatal):", e);
  }
}
