import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MetricCard } from "@/components/murtopolis/metric-card";
import { Panel } from "@/components/murtopolis/panel";
import { TrendChart } from "@/components/murtopolis/trend-chart";
import {
  getOverviewMetrics,
  getSignupSeries,
  listCustomers,
} from "@/lib/murtopolis/queries";
import {
  formatCurrencyFromCents,
  formatNumber,
} from "@/lib/murtopolis/format";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";

export const metadata = { title: "Murtopolis - Overview" };

export default async function MurtopolisOverviewPage() {
  const [metrics, series, recentCustomers] = await Promise.all([
    getOverviewMetrics(),
    getSignupSeries(30),
    listCustomers({ sort: "recent" }),
  ]);

  const recent = recentCustomers.slice(0, 6);

  const chartData: Record<string, string | number>[] = series.map((p) => ({
    date: p.date,
    orgs: p.orgs,
    users: p.users,
    waitlist: p.waitlist,
  }));

  return (
    <div className="space-y-10">
      <Panel
        title="At a glance"
        description="The headline numbers for the whole platform."
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Customers"
            value={formatNumber(metrics.totalOrgs)}
            hint={`${formatNumber(metrics.payingOrgs)} paying · ${formatNumber(
              metrics.compedOrgs,
            )} comped · ${formatNumber(metrics.demoOrgs)} demo`}
          />
          <MetricCard
            label="Total revenue"
            value={formatCurrencyFromCents(metrics.totalRevenueCents)}
            hint={`${formatCurrencyFromCents(
              metrics.monthRevenueCents,
            )} this month`}
          />
          <MetricCard
            label="Users"
            value={formatNumber(metrics.totalUsers)}
            hint={`${formatNumber(metrics.newUsers30d)} new in 30d`}
          />
          <MetricCard
            label="Waitlist"
            value={formatNumber(metrics.waitlistCount)}
            hint="Pre-launch leads"
          />
          <MetricCard
            label="Active users"
            value={formatNumber(metrics.activeUsers7d)}
            tag="7d"
            hint={`${formatNumber(metrics.activeUsers30d)} active in 30d`}
          />
          <MetricCard
            label="Paid events"
            value={formatNumber(metrics.payingEvents)}
            hint={`${formatNumber(metrics.compedEvents)} comped · ${formatNumber(
              metrics.totalEvents,
            )} total`}
          />
          <MetricCard
            label="Seats sold"
            value={formatNumber(metrics.seatsSold)}
            hint="Across paid + comped events"
          />
          <MetricCard
            label="Avg. deal"
            value={
              metrics.payingEvents > 0
                ? formatCurrencyFromCents(
                    Math.round(
                      metrics.totalRevenueCents / metrics.payingEvents,
                    ),
                  )
                : "-"
            }
            hint="Revenue per paid event"
          />
        </div>
      </Panel>

      <Panel
        title="Growth - last 30 days"
        description="New customers, users, and waitlist signups per day."
      >
        <TrendChart
          data={chartData}
          xKey="date"
          xTickFormat="dateShort"
          series={[
            { key: "users", label: "Users", type: "bar" },
            { key: "orgs", label: "Customers", type: "line" },
            { key: "waitlist", label: "Waitlist", type: "line" },
          ]}
        />
        <div className="flex flex-wrap gap-4">
          <Legend swatch="#1A1A1A" label="Users (new accounts)" shape="bar" />
          <Legend swatch="#737373" label="Customers (orgs)" shape="line" />
          <Legend swatch="#A3A3A3" label="Waitlist signups" shape="line" />
        </div>
      </Panel>

      <Panel
        title="Newest customers"
        description="The most recently created organizations."
        actions={
          <Link
            href="/murtopolis/customers"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] transition-colors hover:text-foreground"
          >
            All customers
            <ArrowUpRight className="size-3" />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers yet.</p>
        ) : (
          <ul className="divide-y">
            {recent.map((c) => (
              <li key={c.orgId}>
                <Link
                  href={`/murtopolis/customers/${c.orgId}`}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.orgName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.adminEmail ?? "No admin contact"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs tabular-nums text-foreground">
                      {c.paymentState === "paid"
                        ? formatCurrencyFromCents(c.revenueCents)
                        : c.paymentState === "comped"
                          ? "Comped"
                          : c.paymentState === "demo"
                            ? "Demo"
                            : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeUpdatedAt(c.createdAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Legend({
  swatch,
  label,
  shape,
}: {
  swatch: string;
  label: string;
  shape: "bar" | "line";
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
      <span
        aria-hidden
        className={shape === "bar" ? "h-3 w-2 rounded-[1px]" : "h-0.5 w-4"}
        style={{ backgroundColor: swatch }}
      />
      {label}
    </span>
  );
}
