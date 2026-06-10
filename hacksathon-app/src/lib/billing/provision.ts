import { createAdminClient } from "@/lib/supabase/admin";
import { seedAwardCategories } from "@/lib/awards/categories";
import { seedReflectionQuestions } from "@/lib/reflections/questions";
import { priceForSeats } from "@/lib/billing/pricing";

/**
 * Slug helper - lowercase, ASCII, hyphenated. Collision handling happens
 * at insert time via the unique constraint + suffix retry, so this stays
 * intentionally simple.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type TemplateBlock = {
  block_key: string;
  title: string;
  subtitle?: string;
  duration_minutes?: number;
  description?: string;
  purpose?: string;
  checklists?: unknown[];
};

export interface ProvisionParams {
  userId: string;
  orgName: string;
  /** Optional - defaults to "{orgName} Hacks-a-Thon". */
  eventTitle?: string;
  seatCount: number;
  /** Stripe linkage + idempotency. */
  checkoutSessionId: string;
  stripeCustomerId?: string | null;
  paymentIntentId?: string | null;
  discountCode?: string | null;
  /**
   * Amount Stripe actually collected (session.amount_total), in cents.
   * 0 for a 100%-off promo order. Distinct from price_cents (list price).
   */
  amountPaidCents?: number | null;
}

export interface ProvisionResult {
  eventId: string;
  slug: string;
  alreadyProvisioned: boolean;
}

/**
 * Provision a paid event after a successful Stripe Checkout.
 *
 * Creates: organization -> first admin member -> event (payment_status
 * 'paid') -> seeded timeline blocks, award categories, and reflection
 * questions. Uses the service-role client because the org has no members
 * yet, so the standard RLS bootstrap policy can't apply.
 *
 * Idempotent on `checkoutSessionId`: if an event already exists for that
 * session (webhook + success-page fallback racing, or a webhook replay),
 * we return the existing event instead of double-provisioning. The
 * `events.stripe_checkout_session_id UNIQUE` constraint is the backstop.
 */
export async function provisionPaidEvent(
  params: ProvisionParams,
): Promise<ProvisionResult | { error: string }> {
  const admin = createAdminClient();

  const orgName = params.orgName.trim();
  if (!orgName) return { error: "Organization name is required." };
  const eventTitle =
    params.eventTitle?.trim() || `${orgName} Hacks-a-Thon`;

  // 0. Idempotency - bail early if this session already provisioned.
  const { data: existing } = await admin
    .from("events")
    .select("id, vanity_slug")
    .eq("stripe_checkout_session_id", params.checkoutSessionId)
    .maybeSingle<{ id: string; vanity_slug: string }>();

  if (existing) {
    return {
      eventId: existing.id,
      slug: existing.vanity_slug,
      alreadyProvisioned: true,
    };
  }

  // Authoritative price from the seat count (never trust the client).
  let priceCents: number;
  let participantLimit: number;
  try {
    const quote = priceForSeats(params.seatCount);
    priceCents = quote.amountCents;
    participantLimit = quote.seats;
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Invalid participant count.",
    };
  }

  // 1. Organization - retry on slug collision with a short random suffix.
  const baseSlug = slugify(orgName) || "team";
  let orgId: string | null = null;
  let lastOrgError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: orgRow, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: orgName,
        slug,
        stripe_customer_id: params.stripeCustomerId ?? null,
      })
      .select("id")
      .single();

    if (orgRow) {
      orgId = orgRow.id;
      break;
    }
    if (orgError?.code === "23505") {
      lastOrgError = orgError.message;
      continue;
    }
    return { error: orgError?.message ?? "Failed to create organization." };
  }

  if (!orgId) {
    return { error: lastOrgError ?? "Could not allocate organization slug." };
  }

  // 2. First admin member, immediately active.
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: params.userId,
      role: "admin",
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    return { error: memberError.message };
  }

  // 3. Event in 'active' status, marked paid, with Stripe linkage.
  let eventRow: { id: string; vanity_slug: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const vanitySlug =
      attempt === 0
        ? baseSlug
        : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error: eventError } = await admin
      .from("events")
      .insert({
        organization_id: orgId,
        title: eventTitle,
        status: "active",
        vanity_slug: vanitySlug,
        payment_status: "paid",
        participant_limit: participantLimit,
        price_cents: priceCents,
        amount_paid_cents: params.amountPaidCents ?? null,
        discount_code: params.discountCode ?? null,
        stripe_payment_intent_id: params.paymentIntentId ?? null,
        stripe_checkout_session_id: params.checkoutSessionId,
        // Explicit so a new event always starts with voting + reflections
        // closed (these also have DB defaults of 'closed', but set them
        // here to make intent clear and guard against template drift).
        voting_status: "closed",
        reflection_status: "closed",
      })
      .select("id, vanity_slug")
      .single<{ id: string; vanity_slug: string }>();

    if (data) {
      eventRow = data;
      break;
    }
    // Unique violation could be the vanity slug (retry) or the session id
    // (another worker provisioned concurrently - treat as done).
    if (eventError?.code === "23505") {
      const { data: raced } = await admin
        .from("events")
        .select("id, vanity_slug")
        .eq("stripe_checkout_session_id", params.checkoutSessionId)
        .maybeSingle<{ id: string; vanity_slug: string }>();
      if (raced) {
        return {
          eventId: raced.id,
          slug: raced.vanity_slug,
          alreadyProvisioned: true,
        };
      }
      continue;
    }
    return { error: eventError?.message ?? "Failed to create event." };
  }

  if (!eventRow) {
    return { error: "Could not allocate event vanity URL." };
  }

  // 4. Seed timeline blocks from the default template. Fail-soft - the
  // event home tolerates an empty block list.
  try {
    const { data: template } = await admin
      .from("event_templates")
      .select("blocks")
      .eq("is_default", true)
      .maybeSingle();

    const templateBlocks = Array.isArray(template?.blocks)
      ? (template.blocks as TemplateBlock[])
      : [];

    if (templateBlocks.length > 0) {
      const blockRows = templateBlocks.map((b, index) => ({
        event_id: eventRow.id,
        block_key: b.block_key,
        title: b.title,
        subtitle: b.subtitle ?? null,
        duration_minutes: b.duration_minutes ?? 30,
        description: b.description ?? null,
        purpose: b.purpose ?? null,
        status: "upcoming" as const,
        sort_order: index,
        checklists: b.checklists ?? [],
      }));
      await admin.from("blocks").insert(blockRows);
    }
  } catch {
    // Swallow - event home renders gracefully with zero blocks.
  }

  // 5. Seed award categories + reflection questions. Idempotent helpers,
  // fail-soft.
  try {
    await Promise.all([
      seedAwardCategories(admin, { eventId: eventRow.id, orgName }),
      seedReflectionQuestions(admin, { eventId: eventRow.id }),
    ]);
  } catch {
    // Swallow - M4 surfaces tolerate missing seeds.
  }

  return {
    eventId: eventRow.id,
    slug: eventRow.vanity_slug,
    alreadyProvisioned: false,
  };
}
