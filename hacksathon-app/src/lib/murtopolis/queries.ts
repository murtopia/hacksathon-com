import { createAdminClient } from "@/lib/supabase/admin";
import { loadHelperContext } from "@/lib/helper/loader";
import {
  computeHelperStops,
  computePhase,
  type HelperPhase,
} from "@/lib/helper/phase";
import type { SlugContext, SlugEvent } from "@/lib/routing/slug-context";

export type { HelperPhase };

/**
 * Murtopolis data layer - platform-owner analytics.
 *
 * Every export here reads cross-tenant data with the service-role
 * client (`createAdminClient`), which bypasses RLS. That is required:
 * `waitlist_signups` has no read policy at all, and org/profile RLS is
 * scoped per-membership, so a normal client could only ever see the
 * caller's own tenant. Because these functions are unconditionally
 * privileged, **callers must gate on `requirePlatformAdmin()` /
 * `isPlatformAdmin()` first**. They are only ever imported from server
 * components and route handlers under `/murtopolis`.
 *
 * Billing note: the product charges per-event one-time (not recurring),
 * so "revenue" is the sum of `events.price_cents` for events whose
 * `payment_status` is paid or completed. Most events are `demo` until
 * Stripe checkout is wired; the queries handle that gracefully and will
 * light up automatically once real purchases land.
 */

const PAID_STATUSES = ["paid", "completed"] as const;

export type EventPaymentStatus =
  | "demo"
  | "paid"
  | "completed"
  | "refunded"
  | (string & {});

export type CustomerPaymentState = "paid" | "comped" | "demo" | "none";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  stripe_customer_id: string | null;
  is_internal: boolean;
}

interface EventRow {
  id: string;
  organization_id: string;
  title: string;
  status: string | null;
  payment_status: EventPaymentStatus | null;
  price_cents: number | null;
  amount_paid_cents: number | null;
  participant_limit: number | null;
  vanity_slug: string | null;
  start_date: string | null;
  end_date: string | null;
  public_showcase: boolean | null;
  created_at: string;
}

interface MemberRow {
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  last_active_at: string | null;
  created_at: string;
}

function isPaid(status: EventPaymentStatus | null | undefined): boolean {
  return PAID_STATUSES.includes(status as (typeof PAID_STATUSES)[number]);
}

/**
 * Real money collected for an event: the Stripe `amount_total`, which is
 * 0 for a 100%-off promo (comped). Falls back to 0 for non-paid statuses.
 * `price_cents` is the LIST price and is intentionally ignored here.
 */
function collectedCents(e: {
  payment_status: EventPaymentStatus | null;
  amount_paid_cents: number | null;
}): number {
  return isPaid(e.payment_status) ? (e.amount_paid_cents ?? 0) : 0;
}

/** A paid-status event that actually collected money. */
function isRealPaid(e: {
  payment_status: EventPaymentStatus | null;
  amount_paid_cents: number | null;
}): boolean {
  return isPaid(e.payment_status) && (e.amount_paid_cents ?? 0) > 0;
}

/** A paid-status event that collected nothing (100%-off promo). */
function isComped(e: {
  payment_status: EventPaymentStatus | null;
  amount_paid_cents: number | null;
}): boolean {
  return isPaid(e.payment_status) && (e.amount_paid_cents ?? 0) <= 0;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// ---------------------------------------------------------------------------
// Overview metrics
// ---------------------------------------------------------------------------

export interface OverviewMetrics {
  totalOrgs: number;
  payingOrgs: number;
  compedOrgs: number;
  demoOrgs: number;
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsers30d: number;
  waitlistCount: number;
  totalEvents: number;
  payingEvents: number;
  compedEvents: number;
  seatsSold: number;
  totalRevenueCents: number;
  monthRevenueCents: number;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const admin = createAdminClient();
  const monthStart = startOfMonthISO();
  const since7d = daysAgoISO(7);
  const since30d = daysAgoISO(30);

  const [
    { count: totalOrgs },
    { count: totalUsers },
    { count: activeUsers7d },
    { count: activeUsers30d },
    { count: newUsers30d },
    { count: waitlistCount },
    { data: events },
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("is_internal", false),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_active_at", since7d),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_active_at", since30d),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since30d),
    admin.from("waitlist_signups").select("*", { count: "exact", head: true }),
    admin
      .from("events")
      .select(
        "id, organization_id, payment_status, price_cents, amount_paid_cents, participant_limit, created_at, organizations!inner(is_internal)",
      )
      .eq("organizations.is_internal", false),
  ]);

  const eventRows = (events ?? []) as Pick<
    EventRow,
    | "id"
    | "organization_id"
    | "payment_status"
    | "price_cents"
    | "amount_paid_cents"
    | "participant_limit"
    | "created_at"
  >[];

  const payingOrgIds = new Set<string>();
  const compedOrgIds = new Set<string>();
  let payingEvents = 0;
  let compedEvents = 0;
  let seatsSold = 0;
  let totalRevenueCents = 0;
  let monthRevenueCents = 0;

  for (const e of eventRows) {
    if (!isPaid(e.payment_status)) continue;
    // Seats are "sold" for any provisioned (paid-status) event, comped or not.
    seatsSold += e.participant_limit ?? 0;

    if (isRealPaid(e)) {
      payingEvents += 1;
      payingOrgIds.add(e.organization_id);
      const cents = collectedCents(e);
      totalRevenueCents += cents;
      if (e.created_at >= monthStart) monthRevenueCents += cents;
    } else {
      compedEvents += 1;
      compedOrgIds.add(e.organization_id);
    }
  }

  // An org that has any real-paid event counts as paying even if it also
  // has comped events; comped-only orgs are counted separately.
  for (const id of payingOrgIds) compedOrgIds.delete(id);

  const totalOrgsCount = totalOrgs ?? 0;

  return {
    totalOrgs: totalOrgsCount,
    payingOrgs: payingOrgIds.size,
    compedOrgs: compedOrgIds.size,
    demoOrgs: Math.max(
      totalOrgsCount - payingOrgIds.size - compedOrgIds.size,
      0,
    ),
    totalUsers: totalUsers ?? 0,
    activeUsers7d: activeUsers7d ?? 0,
    activeUsers30d: activeUsers30d ?? 0,
    newUsers30d: newUsers30d ?? 0,
    waitlistCount: waitlistCount ?? 0,
    totalEvents: eventRows.length,
    payingEvents,
    compedEvents,
    seatsSold,
    totalRevenueCents,
    monthRevenueCents,
  };
}

// ---------------------------------------------------------------------------
// Signup / growth time series
// ---------------------------------------------------------------------------

export interface SignupSeriesPoint {
  date: string; // YYYY-MM-DD
  orgs: number;
  users: number;
  waitlist: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function getSignupSeries(
  days = 30,
): Promise<SignupSeriesPoint[]> {
  const admin = createAdminClient();
  const since = daysAgoISO(days - 1);
  const sinceDay = dayKey(since);

  const [{ data: orgs }, { data: users }, { data: waitlist }] =
    await Promise.all([
      admin
        .from("organizations")
        .select("created_at")
        .eq("is_internal", false)
        .gte("created_at", since),
      admin.from("profiles").select("created_at").gte("created_at", since),
      admin
        .from("waitlist_signups")
        .select("created_at")
        .gte("created_at", since),
    ]);

  const buckets = new Map<string, SignupSeriesPoint>();
  // Seed an entry for every day in the window so the chart has a
  // continuous x-axis even on days with zero signups.
  for (let i = 0; i < days; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, orgs: 0, users: 0, waitlist: 0 });
  }

  const tally = (
    rows: { created_at: string }[] | null,
    field: "orgs" | "users" | "waitlist",
  ) => {
    for (const row of rows ?? []) {
      const key = dayKey(row.created_at);
      if (key < sinceDay) continue;
      const point = buckets.get(key);
      if (point) point[field] += 1;
    }
  };

  tally(orgs, "orgs");
  tally(users, "users");
  tally(waitlist, "waitlist");

  return Array.from(buckets.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
}

// ---------------------------------------------------------------------------
// Customers (organizations)
// ---------------------------------------------------------------------------

export interface CustomerEventSummary {
  id: string;
  title: string;
  status: string | null;
  paymentStatus: EventPaymentStatus | null;
  priceCents: number | null;
  amountPaidCents: number | null;
  participantLimit: number | null;
  vanitySlug: string | null;
  startDate: string | null;
  endDate: string | null;
  publicShowcase: boolean | null;
  createdAt: string;
}

export interface CustomerMember {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  lastActiveAt: string | null;
}

export interface CustomerSummary {
  orgId: string;
  orgName: string;
  orgSlug: string;
  createdAt: string;
  stripeCustomerId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  memberCount: number;
  eventCount: number;
  paymentState: CustomerPaymentState;
  seats: number;
  revenueCents: number;
  lastActiveAt: string | null;
  vanitySlug: string | null;
  primaryEventId: string | null;
  /**
   * Helper phase + warn-flag count for the primary event. Populated by
   * `listCustomers` (which fans out the progress engine per customer);
   * `null` / `0` elsewhere so `loadCustomerDataset` stays cheap.
   */
  phase: HelperPhase | null;
  warnFlagCount: number;
  /** True when marked as a platform test account (hidden from metrics/alerts). */
  isInternal: boolean;
}

interface CustomerDataset {
  customers: CustomerSummary[];
  eventsByOrg: Map<string, CustomerEventSummary[]>;
  membersByOrg: Map<string, CustomerMember[]>;
  orgById: Map<string, CustomerSummary>;
}

async function loadCustomerDataset(): Promise<CustomerDataset> {
  const admin = createAdminClient();

  // Include internal (test) orgs so the customers list can show them under
  // Billing → Test and so getCustomerDetail still resolves after toggling.
  // Overview metrics / revenue / cron keep their own is_internal=false filters.
  const [{ data: orgs }, { data: events }, { data: members }, { data: profiles }] =
    await Promise.all([
      admin
        .from("organizations")
        .select("id, name, slug, created_at, stripe_customer_id, is_internal"),
      admin
        .from("events")
        .select(
          "id, organization_id, title, status, payment_status, price_cents, amount_paid_cents, participant_limit, vanity_slug, start_date, end_date, public_showcase, created_at",
        ),
      admin
        .from("organization_members")
        .select("organization_id, user_id, role, status"),
      admin
        .from("profiles")
        .select("id, email, full_name, avatar_url, last_active_at, created_at"),
    ]);

  const orgRows = (orgs ?? []) as OrgRow[];
  const eventRows = (events ?? []) as EventRow[];
  const memberRows = (members ?? []) as MemberRow[];
  const profileRows = (profiles ?? []) as ProfileRow[];

  const profileById = new Map<string, ProfileRow>();
  for (const p of profileRows) profileById.set(p.id, p);

  const eventsByOrg = new Map<string, CustomerEventSummary[]>();
  for (const e of eventRows) {
    const list = eventsByOrg.get(e.organization_id) ?? [];
    list.push({
      id: e.id,
      title: e.title,
      status: e.status,
      paymentStatus: e.payment_status,
      priceCents: e.price_cents,
      amountPaidCents: e.amount_paid_cents,
      participantLimit: e.participant_limit,
      vanitySlug: e.vanity_slug,
      startDate: e.start_date,
      endDate: e.end_date,
      publicShowcase: e.public_showcase,
      createdAt: e.created_at,
    });
    eventsByOrg.set(e.organization_id, list);
  }

  const membersByOrg = new Map<string, CustomerMember[]>();
  for (const m of memberRows) {
    const profile = profileById.get(m.user_id);
    const list = membersByOrg.get(m.organization_id) ?? [];
    list.push({
      userId: m.user_id,
      email: profile?.email ?? "-",
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      role: m.role,
      status: m.status,
      lastActiveAt: profile?.last_active_at ?? null,
    });
    membersByOrg.set(m.organization_id, list);
  }

  const customers: CustomerSummary[] = [];
  const orgById = new Map<string, CustomerSummary>();

  for (const org of orgRows) {
    const orgEvents = eventsByOrg.get(org.id) ?? [];
    const orgMembers = membersByOrg.get(org.id) ?? [];
    const activeMembers = orgMembers.filter((m) => m.status === "active");

    const adminMember =
      activeMembers.find((m) => m.role === "admin") ??
      orgMembers.find((m) => m.role === "admin") ??
      null;

    const hasRealPaid = orgEvents.some(
      (e) => isPaid(e.paymentStatus) && (e.amountPaidCents ?? 0) > 0,
    );
    const hasComped = orgEvents.some(
      (e) => isPaid(e.paymentStatus) && (e.amountPaidCents ?? 0) <= 0,
    );
    const hasDemo = orgEvents.some((e) => e.paymentStatus === "demo");
    const paymentState: CustomerPaymentState = hasRealPaid
      ? "paid"
      : hasComped
        ? "comped"
        : hasDemo
          ? "demo"
          : "none";

    let seats = 0;
    let revenueCents = 0;
    for (const e of orgEvents) {
      if (!isPaid(e.paymentStatus)) continue;
      seats += e.participantLimit ?? 0;
      // Real collected money only - comped events contribute $0.
      revenueCents += e.amountPaidCents ?? 0;
    }

    let lastActiveAt: string | null = null;
    for (const m of orgMembers) {
      if (m.lastActiveAt && (!lastActiveAt || m.lastActiveAt > lastActiveAt)) {
        lastActiveAt = m.lastActiveAt;
      }
    }

    const primaryEvent =
      orgEvents.find((e) => e.vanitySlug) ?? orgEvents[0] ?? null;

    const summary: CustomerSummary = {
      orgId: org.id,
      orgName: org.name,
      orgSlug: org.slug,
      createdAt: org.created_at,
      stripeCustomerId: org.stripe_customer_id,
      adminName: adminMember?.fullName ?? null,
      adminEmail: adminMember?.email ?? null,
      memberCount: activeMembers.length,
      eventCount: orgEvents.length,
      paymentState,
      seats,
      revenueCents,
      lastActiveAt,
      vanitySlug: primaryEvent?.vanitySlug ?? null,
      primaryEventId: primaryEvent?.id ?? null,
      phase: null,
      warnFlagCount: 0,
      isInternal: Boolean(org.is_internal),
    };

    customers.push(summary);
    orgById.set(org.id, summary);
  }

  return { customers, eventsByOrg, membersByOrg, orgById };
}

/** Billing toolbar filter: payment states, plus "test" for is_internal orgs. */
export type CustomerListFilter = CustomerPaymentState | "all" | "test";

export interface ListCustomersOptions {
  search?: string;
  paymentState?: CustomerListFilter;
  sort?: "recent" | "revenue" | "name" | "members";
}

export async function listCustomers(
  options: ListCustomersOptions = {},
): Promise<CustomerSummary[]> {
  const { search, paymentState = "all", sort = "recent" } = options;
  const { customers } = await loadCustomerDataset();

  let rows = customers;

  // "All" = real customers only. "Test" = internal accounts. Payment
  // filters also exclude test orgs so the default list stays clean.
  if (paymentState === "test") {
    rows = rows.filter((c) => c.isInternal);
  } else if (paymentState === "all") {
    rows = rows.filter((c) => !c.isInternal);
  } else {
    rows = rows.filter(
      (c) => !c.isInternal && c.paymentState === paymentState,
    );
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (c) =>
        c.orgName.toLowerCase().includes(q) ||
        c.orgSlug.toLowerCase().includes(q) ||
        (c.adminEmail?.toLowerCase().includes(q) ?? false) ||
        (c.adminName?.toLowerCase().includes(q) ?? false) ||
        (c.vanitySlug?.toLowerCase().includes(q) ?? false),
    );
  }

  // Attach primary-event progress (phase + warn-flag count) so the list
  // answers "who needs attention" at a glance. Parallel fan-out; the
  // customer count is small so per-row helper loads are fine here.
  const withEvents = rows.filter((c) => c.primaryEventId);
  if (withEvents.length > 0) {
    const admin = createAdminClient();
    const { data: eventRows } = await admin
      .from("events")
      .select(PROGRESS_EVENT_COLUMNS)
      .in(
        "id",
        withEvents.map((c) => c.primaryEventId as string),
      )
      .neq("status", "archived");
    const rowById = new Map(
      ((eventRows ?? []) as unknown as ProgressEventRow[]).map((e) => [
        e.id,
        e,
      ]),
    );
    await Promise.all(
      withEvents.map(async (c) => {
        const eventRow = rowById.get(c.primaryEventId as string);
        if (!eventRow) return;
        const progress = await computeEventProgress(eventRow, c.orgName);
        c.phase = progress.phase;
        c.warnFlagCount = progress.flags.filter(
          (f) => f.severity === "warn",
        ).length;
      }),
    );
  }

  const sorted = [...rows];
  switch (sort) {
    case "revenue":
      sorted.sort((a, b) => b.revenueCents - a.revenueCents);
      break;
    case "name":
      sorted.sort((a, b) => a.orgName.localeCompare(b.orgName));
      break;
    case "members":
      sorted.sort((a, b) => b.memberCount - a.memberCount);
      break;
    case "recent":
    default:
      sorted.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      break;
  }

  return sorted;
}

export interface CustomerDetail {
  summary: CustomerSummary;
  events: CustomerEventSummary[];
  members: CustomerMember[];
}

export async function getCustomerDetail(
  orgId: string,
): Promise<CustomerDetail | null> {
  const { orgById, eventsByOrg, membersByOrg } = await loadCustomerDataset();
  const summary = orgById.get(orgId);
  if (!summary) return null;

  const events = [...(eventsByOrg.get(orgId) ?? [])].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
  const members = [...(membersByOrg.get(orgId) ?? [])].sort((a, b) => {
    // Admins first, then by most-recently-active.
    if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
    const aTime = a.lastActiveAt ?? "";
    const bTime = b.lastActiveAt ?? "";
    return aTime < bTime ? 1 : -1;
  });

  return { summary, events, members };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  orgCount: number;
  isAdminSomewhere: boolean;
}

export type UserRoleFilter = "all" | "admin" | "participant";

export interface ListUsersOptions {
  search?: string;
  role?: UserRoleFilter;
}

export async function listUsers(
  options: ListUsersOptions = {},
): Promise<PlatformUser[]> {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: members }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, avatar_url, last_active_at, created_at")
      .order("created_at", { ascending: false }),
    admin.from("organization_members").select("user_id, role, status"),
  ]);

  const memberRows = (members ?? []) as MemberRow[];
  const orgCountByUser = new Map<string, number>();
  const adminByUser = new Set<string>();
  for (const m of memberRows) {
    if (m.status !== "active") continue;
    orgCountByUser.set(m.user_id, (orgCountByUser.get(m.user_id) ?? 0) + 1);
    if (m.role === "admin") adminByUser.add(m.user_id);
  }

  let rows = ((profiles ?? []) as ProfileRow[]).map<PlatformUser>((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    avatarUrl: p.avatar_url,
    lastActiveAt: p.last_active_at,
    createdAt: p.created_at,
    orgCount: orgCountByUser.get(p.id) ?? 0,
    isAdminSomewhere: adminByUser.has(p.id),
  }));

  const role = options.role ?? "all";
  if (role === "admin") {
    rows = rows.filter((u) => u.isAdminSomewhere);
  } else if (role === "participant") {
    rows = rows.filter((u) => !u.isAdminSomewhere);
  }

  const search = options.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (u) =>
        u.email.toLowerCase().includes(search) ||
        (u.fullName?.toLowerCase().includes(search) ?? false),
    );
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export interface WaitlistSignup {
  id: string;
  email: string;
  name: string;
  company: string;
  teamSize: string;
  source: string;
  notifiedAt: string | null;
  createdAt: string;
}

export interface ListWaitlistOptions {
  search?: string;
  teamSize?: string | "all";
  source?: string | "all";
  notified?: "all" | "notified" | "pending";
}

export interface WaitlistResult {
  rows: WaitlistSignup[];
  total: number;
  teamSizes: string[];
  sources: string[];
}

export async function listWaitlist(
  options: ListWaitlistOptions = {},
): Promise<WaitlistResult> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("waitlist_signups")
    .select("id, email, name, company, team_size, source, notified_at, created_at")
    .order("created_at", { ascending: false });

  const all = ((data ?? []) as {
    id: string;
    email: string;
    name: string;
    company: string;
    team_size: string;
    source: string;
    notified_at: string | null;
    created_at: string;
  }[]).map<WaitlistSignup>((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    company: r.company,
    teamSize: r.team_size,
    source: r.source,
    notifiedAt: r.notified_at,
    createdAt: r.created_at,
  }));

  const teamSizes = Array.from(new Set(all.map((r) => r.teamSize))).sort();
  const sources = Array.from(new Set(all.map((r) => r.source))).sort();

  let rows = all;
  const { search, teamSize = "all", source = "all", notified = "all" } = options;

  if (teamSize !== "all") rows = rows.filter((r) => r.teamSize === teamSize);
  if (source !== "all") rows = rows.filter((r) => r.source === source);
  if (notified === "notified") rows = rows.filter((r) => r.notifiedAt);
  if (notified === "pending") rows = rows.filter((r) => !r.notifiedAt);

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q),
    );
  }

  return { rows, total: all.length, teamSizes, sources };
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export interface RevenueMonth {
  month: string; // YYYY-MM
  label: string; // e.g. "May 2026"
  revenueCents: number;
  events: number;
  seats: number;
}

export interface RevenueBreakdown {
  months: RevenueMonth[];
  totalRevenueCents: number;
  totalPaidEvents: number;
  totalSeats: number;
  byStatus: { status: string; count: number; revenueCents: number }[];
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

export async function getRevenueByMonth(
  months = 12,
): Promise<RevenueBreakdown> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select(
      "payment_status, price_cents, amount_paid_cents, participant_limit, created_at, organizations!inner(is_internal)",
    )
    .eq("organizations.is_internal", false);

  const rows = (data ?? []) as Pick<
    EventRow,
    | "payment_status"
    | "price_cents"
    | "amount_paid_cents"
    | "participant_limit"
    | "created_at"
  >[];

  const monthMap = new Map<string, RevenueMonth>();
  for (let i = 0; i < months; i += 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, {
      month: key,
      label: MONTH_LABEL.format(d),
      revenueCents: 0,
      events: 0,
      seats: 0,
    });
  }

  const byStatusMap = new Map<string, { count: number; revenueCents: number }>();
  let totalRevenueCents = 0;
  let totalPaidEvents = 0;
  let totalSeats = 0;

  for (const r of rows) {
    const collected = collectedCents(r);

    // Break paid-status events into real "paid" vs "comped" (promo $0);
    // everything else groups under its own payment_status.
    const statusKey = isRealPaid(r)
      ? "paid"
      : isComped(r)
        ? "comped"
        : ((r.payment_status ?? "demo") as string);
    const bucket = byStatusMap.get(statusKey) ?? { count: 0, revenueCents: 0 };
    bucket.count += 1;
    bucket.revenueCents += collected;
    byStatusMap.set(statusKey, bucket);

    // Totals + the monthly chart are real collected revenue only.
    if (!isRealPaid(r)) continue;

    const seats = r.participant_limit ?? 0;
    totalRevenueCents += collected;
    totalPaidEvents += 1;
    totalSeats += seats;

    const created = new Date(r.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const month = monthMap.get(key);
    if (month) {
      month.revenueCents += collected;
      month.events += 1;
      month.seats += seats;
    }
  }

  const byStatus = Array.from(byStatusMap.entries())
    .map(([status, v]) => ({ status, ...v }))
    .sort((a, b) => b.count - a.count);

  return {
    months: Array.from(monthMap.values()),
    totalRevenueCents,
    totalPaidEvents,
    totalSeats,
    byStatus,
  };
}

// ---------------------------------------------------------------------------
// Event progress + roadblock flags
// ---------------------------------------------------------------------------

export interface ProgressFlag {
  /**
   * Stable per flag-type + event (e.g. "low-join-rate:<eventId>") so the
   * platform_alerts dedupe can tell a new flag from an ongoing one.
   */
  key: string;
  severity: "warn" | "info";
  message: string;
}

export interface ProgressPendingStep {
  label: string;
  kind: "required" | "recommended";
}

export interface EventFunnel {
  /** Email invitations sent (event_invitations rows). */
  invited: number;
  /** Active org members - the joined roster, admin included. */
  joined: number;
  postedIdea: number;
  generatedBlueprint: number;
  voted: number;
  reflected: number;
}

export interface EventProgress {
  eventId: string;
  eventTitle: string;
  vanitySlug: string | null;
  createdAt: string;
  phase: HelperPhase;
  requiredDone: number;
  requiredTotal: number;
  /** Pending setup steps (required + recommended; event-day steps excluded). */
  pendingSteps: ProgressPendingStep[];
  scheduledBlocks: number;
  totalBlocks: number;
  /** First and last scheduled block start times - the event window. */
  windowStart: string | null;
  windowEnd: string | null;
  nextBlock: { title: string; scheduledAt: string } | null;
  votingStatus: "closed" | "open" | "revealed";
  reflectionStatus: "closed" | "open" | "complete";
  recapGenerated: boolean;
  recapApproved: boolean;
  activeMembers: number;
  funnel: EventFunnel;
  flags: ProgressFlag[];
}

export interface DeriveFlagsInput {
  eventId: string;
  eventCreatedAt: string;
  votingStatus: string;
  scheduledBlocks: number;
  /** End of the last scheduled block (start + duration), ms epoch. */
  windowEndMs: number | null;
  invitedCount: number;
  oldestInviteAt: string | null;
  acceptedInvites: number;
  ideaUsers: number;
  blueprintUsers: number;
  recapGenerated: boolean;
  recapApproved: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pure roadblock heuristics. Each flag key is stable per flag type +
 * event so the daily sweep can diff against `platform_alerts` (a flag
 * that clears is deleted there; if it recurs it re-alerts).
 */
export function deriveFlags(
  input: DeriveFlagsInput,
  now: Date = new Date(),
): ProgressFlag[] {
  const flags: ProgressFlag[] = [];
  const t = now.getTime();

  // Low join rate: 3+ invites sent, the oldest 3+ days ago, and fewer
  // than half have been accepted. Small invite counts don't trip it.
  if (input.invitedCount >= 3 && input.oldestInviteAt) {
    const oldest = new Date(input.oldestInviteAt).getTime();
    if (
      !Number.isNaN(oldest) &&
      t - oldest >= 3 * DAY_MS &&
      input.acceptedInvites < input.invitedCount / 2
    ) {
      flags.push({
        key: `low-join-rate:${input.eventId}`,
        severity: "warn",
        message: `Only ${input.acceptedInvites} of ${input.invitedCount} invites accepted after 3+ days.`,
      });
    }
  }

  // Nothing scheduled 3+ weeks (21 days) after the event was created.
  const created = new Date(input.eventCreatedAt).getTime();
  if (
    input.scheduledBlocks === 0 &&
    !Number.isNaN(created) &&
    t - created >= 21 * DAY_MS
  ) {
    flags.push({
      key: `nothing-scheduled:${input.eventId}`,
      severity: "warn",
      message: "No blocks scheduled 3+ weeks after purchase.",
    });
  }

  // Event window has fully passed but voting was never opened.
  if (
    input.windowEndMs !== null &&
    t > input.windowEndMs &&
    input.votingStatus === "closed"
  ) {
    flags.push({
      key: `voting-never-opened:${input.eventId}`,
      severity: "warn",
      message: "Event window has passed but voting was never opened.",
    });
  }

  // Participants posted ideas but nobody generated a Blueprint - the
  // planning flow may be stuck or undiscovered.
  if (input.ideaUsers > 0 && input.blueprintUsers === 0) {
    flags.push({
      key: `ideas-no-blueprints:${input.eventId}`,
      severity: "info",
      message: `${input.ideaUsers} ${input.ideaUsers === 1 ? "person" : "people"} posted ideas but nobody has generated a Blueprint.`,
    });
  }

  // Recap generated but sitting unapproved - the wrap-up is stalled at
  // the finish line.
  if (input.recapGenerated && !input.recapApproved) {
    flags.push({
      key: `recap-unapproved:${input.eventId}`,
      severity: "info",
      message: "AI recap was generated but hasn't been approved yet.",
    });
  }

  return flags;
}

/** Event columns the progress engine needs (superset of what the Helper reads). */
const PROGRESS_EVENT_COLUMNS =
  "id, organization_id, title, status, vanity_slug, created_at, welcome_message, logo_url, settings, voting_status, voting_open_at, voting_close_at, results_published_at, reflection_status, reflections_open_at, reflections_close_at, reflection_summary, reflection_summary_approved_at, build_tool";

interface ProgressEventRow {
  id: string;
  organization_id: string;
  title: string;
  status: string | null;
  vanity_slug: string | null;
  created_at: string;
  welcome_message: string | null;
  logo_url: string | null;
  settings: Record<string, unknown> | null;
  voting_status: "closed" | "open" | "revealed";
  voting_open_at: string | null;
  voting_close_at: string | null;
  results_published_at: string | null;
  reflection_status: "closed" | "open" | "complete";
  reflections_open_at: string | null;
  reflections_close_at: string | null;
  reflection_summary: string | null;
  reflection_summary_approved_at: string | null;
  build_tool: string;
}

function distinctUsers(rows: { user_id: string }[] | null): number {
  return new Set((rows ?? []).map((r) => r.user_id)).size;
}

/**
 * Compute the full progress picture for one event: Helper checklist
 * state (reusing the exact functions the customer's own Hacky Helper
 * uses), block schedule, engagement funnel, and roadblock flags.
 */
async function computeEventProgress(
  event: ProgressEventRow,
  orgName: string,
): Promise<EventProgress> {
  const admin = createAdminClient();
  const slug = event.vanity_slug ?? "_";

  // Adapt the row into the SlugContext shape loadHelperContext expects.
  // The fields we didn't fetch aren't read by the Helper.
  const ctx: SlugContext = {
    slug,
    event: {
      ...event,
      description: null,
      status: event.status ?? "draft",
      welcome_video_url: null,
      vanity_slug: event.vanity_slug ?? "",
      is_locked: false,
      public_showcase: false,
      reflection_summary_generated_at: null,
    } as SlugEvent,
    org: { id: event.organization_id, name: orgName, slug: "", logo_url: null },
  };

  const [
    helperCtx,
    { data: blocks },
    { data: members },
    { data: invites },
    { data: ideas },
    { data: briefs },
    { data: votes },
    { data: reflections },
  ] = await Promise.all([
    loadHelperContext(ctx),
    admin
      .from("blocks")
      .select("title, scheduled_date, duration_minutes")
      .eq("event_id", event.id),
    admin
      .from("organization_members")
      .select("user_id, status")
      .eq("organization_id", event.organization_id),
    admin
      .from("event_invitations")
      .select("status, invited_at")
      .eq("event_id", event.id),
    admin.from("ideas").select("user_id").eq("event_id", event.id),
    admin
      .from("project_briefs")
      .select("user_id")
      .eq("event_id", event.id)
      .eq("is_current", true),
    admin.from("votes").select("user_id").eq("event_id", event.id),
    admin.from("reflections").select("user_id").eq("event_id", event.id),
  ]);

  const stops = computeHelperStops(helperCtx, slug);
  const phase = computePhase(helperCtx);
  const requiredTotal = stops.reduce((sum, s) => sum + s.requiredTotal, 0);
  const requiredDone = stops.reduce((sum, s) => sum + s.requiredDone, 0);
  const pendingSteps: ProgressPendingStep[] = stops.flatMap((stop) =>
    stop.steps
      .filter((s) => s.state === "pending" && s.kind !== "event-day")
      .map((s) => ({ label: s.label, kind: s.kind as "required" | "recommended" })),
  );

  const blockRows = (blocks ?? []) as {
    title: string;
    scheduled_date: string | null;
    duration_minutes: number | null;
  }[];
  const scheduled = blockRows.filter((b) => b.scheduled_date);
  scheduled.sort((a, b) =>
    (a.scheduled_date as string) < (b.scheduled_date as string) ? -1 : 1,
  );
  const windowStart = scheduled[0]?.scheduled_date ?? null;
  const windowEnd = scheduled[scheduled.length - 1]?.scheduled_date ?? null;

  const now = new Date();
  const nowMs = now.getTime();
  const upcoming = scheduled.find(
    (b) => new Date(b.scheduled_date as string).getTime() > nowMs,
  );
  const nextBlock = upcoming
    ? { title: upcoming.title, scheduledAt: upcoming.scheduled_date as string }
    : null;

  // End of the last scheduled block including its duration - used by
  // the "window passed, voting never opened" flag.
  let windowEndMs: number | null = null;
  for (const b of scheduled) {
    const start = new Date(b.scheduled_date as string).getTime();
    if (Number.isNaN(start)) continue;
    const end = start + (b.duration_minutes ?? 30) * 60_000;
    if (windowEndMs === null || end > windowEndMs) windowEndMs = end;
  }

  const memberRows = (members ?? []) as { user_id: string; status: string }[];
  const activeMembers = memberRows.filter((m) => m.status === "active").length;

  const inviteRows = (invites ?? []) as {
    status: string;
    invited_at: string;
  }[];
  const invitedCount = inviteRows.length;
  const acceptedInvites = inviteRows.filter(
    (i) => i.status === "accepted",
  ).length;
  let oldestInviteAt: string | null = null;
  for (const i of inviteRows) {
    if (!oldestInviteAt || i.invited_at < oldestInviteAt) {
      oldestInviteAt = i.invited_at;
    }
  }

  const funnel: EventFunnel = {
    invited: invitedCount,
    joined: activeMembers,
    postedIdea: distinctUsers(ideas),
    generatedBlueprint: distinctUsers(briefs),
    voted: distinctUsers(votes),
    reflected: distinctUsers(reflections),
  };

  const recapGenerated = Boolean(event.reflection_summary?.trim());
  const recapApproved = Boolean(event.reflection_summary_approved_at);

  const flags = deriveFlags(
    {
      eventId: event.id,
      eventCreatedAt: event.created_at,
      votingStatus: event.voting_status,
      scheduledBlocks: scheduled.length,
      windowEndMs,
      invitedCount,
      oldestInviteAt,
      acceptedInvites,
      ideaUsers: funnel.postedIdea,
      blueprintUsers: funnel.generatedBlueprint,
      recapGenerated,
      recapApproved,
    },
    now,
  );

  return {
    eventId: event.id,
    eventTitle: event.title,
    vanitySlug: event.vanity_slug,
    createdAt: event.created_at,
    phase,
    requiredDone,
    requiredTotal,
    pendingSteps,
    scheduledBlocks: scheduled.length,
    totalBlocks: blockRows.length,
    windowStart,
    windowEnd,
    nextBlock,
    votingStatus: event.voting_status,
    reflectionStatus: event.reflection_status,
    recapGenerated,
    recapApproved,
    activeMembers,
    funnel,
    flags,
  };
}

/**
 * Progress for every non-archived event of one customer, newest first.
 * Used by the customer detail page.
 */
export async function getCustomerEventProgress(
  orgId: string,
): Promise<EventProgress[]> {
  const admin = createAdminClient();
  const [{ data: org }, { data: events }] = await Promise.all([
    admin
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle<{ name: string }>(),
    admin
      .from("events")
      .select(PROGRESS_EVENT_COLUMNS)
      .eq("organization_id", orgId)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
  ]);
  if (!org) return [];

  const rows = (events ?? []) as unknown as ProgressEventRow[];
  return Promise.all(rows.map((e) => computeEventProgress(e, org.name)));
}

export interface CustomerProgress {
  orgId: string;
  orgName: string;
  events: EventProgress[];
}

/**
 * Progress for every non-archived event across all external customers.
 * Powers the daily health sweep (cron). Customer count is small, so
 * the per-event fan-out is fine at this scale.
 */
export async function getAllCustomerProgress(): Promise<CustomerProgress[]> {
  const admin = createAdminClient();
  const [{ data: orgs }, { data: events }] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name")
      .eq("is_internal", false),
    admin
      .from("events")
      .select(`${PROGRESS_EVENT_COLUMNS}, organizations!inner(is_internal)`)
      .eq("organizations.is_internal", false)
      .neq("status", "archived"),
  ]);

  const orgRows = (orgs ?? []) as { id: string; name: string }[];
  const eventRows = (events ?? []) as unknown as ProgressEventRow[];
  const nameById = new Map(orgRows.map((o) => [o.id, o.name]));

  const progressById = new Map<string, EventProgress>();
  await Promise.all(
    eventRows.map(async (e) => {
      const progress = await computeEventProgress(
        e,
        nameById.get(e.organization_id) ?? "",
      );
      progressById.set(e.id, progress);
    }),
  );

  return orgRows
    .map((o) => ({
      orgId: o.id,
      orgName: o.name,
      events: eventRows
        .filter((e) => e.organization_id === o.id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .map((e) => progressById.get(e.id))
        .filter((p): p is EventProgress => Boolean(p)),
    }))
    .filter((c) => c.events.length > 0);
}
