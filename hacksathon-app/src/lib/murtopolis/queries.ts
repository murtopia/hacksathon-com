import { createAdminClient } from "@/lib/supabase/admin";

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
}

interface CustomerDataset {
  customers: CustomerSummary[];
  eventsByOrg: Map<string, CustomerEventSummary[]>;
  membersByOrg: Map<string, CustomerMember[]>;
  orgById: Map<string, CustomerSummary>;
}

async function loadCustomerDataset(): Promise<CustomerDataset> {
  const admin = createAdminClient();

  const [{ data: orgs }, { data: events }, { data: members }, { data: profiles }] =
    await Promise.all([
      admin
        .from("organizations")
        .select("id, name, slug, created_at, stripe_customer_id")
        .eq("is_internal", false),
      admin
        .from("events")
        .select(
          "id, organization_id, title, status, payment_status, price_cents, amount_paid_cents, participant_limit, vanity_slug, start_date, end_date, public_showcase, created_at, organizations!inner(is_internal)",
        )
        .eq("organizations.is_internal", false),
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
    };

    customers.push(summary);
    orgById.set(org.id, summary);
  }

  return { customers, eventsByOrg, membersByOrg, orgById };
}

export interface ListCustomersOptions {
  search?: string;
  paymentState?: CustomerPaymentState | "all";
  sort?: "recent" | "revenue" | "name" | "members";
}

export async function listCustomers(
  options: ListCustomersOptions = {},
): Promise<CustomerSummary[]> {
  const { search, paymentState = "all", sort = "recent" } = options;
  const { customers } = await loadCustomerDataset();

  let rows = customers;

  if (paymentState !== "all") {
    rows = rows.filter((c) => c.paymentState === paymentState);
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
