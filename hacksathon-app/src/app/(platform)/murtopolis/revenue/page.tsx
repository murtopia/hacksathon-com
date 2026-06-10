import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/murtopolis/metric-card";
import { EmptyState, Panel } from "@/components/murtopolis/panel";
import { TrendChart } from "@/components/murtopolis/trend-chart";
import { getRevenueByMonth } from "@/lib/murtopolis/queries";
import {
  formatCurrencyFromCents,
  formatNumber,
  paymentStatusLabel,
} from "@/lib/murtopolis/format";

export const metadata = { title: "Murtopolis - Revenue" };

export default async function RevenuePage() {
  const breakdown = await getRevenueByMonth(12);
  const hasRevenue = breakdown.totalRevenueCents > 0;

  const chartData: Record<string, string | number>[] = breakdown.months.map(
    (m) => ({
      label: m.label,
      revenue: Math.round(m.revenueCents / 100),
    }),
  );

  return (
    <div className="space-y-10">
      <Panel
        title="Revenue"
        description="Per-event one-time purchases. Recurring revenue isn't part of the model - each paid event is a transaction."
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total revenue"
            value={formatCurrencyFromCents(breakdown.totalRevenueCents)}
            hint="All paid events"
          />
          <MetricCard
            label="Paid events"
            value={formatNumber(breakdown.totalPaidEvents)}
          />
          <MetricCard
            label="Seats sold"
            value={formatNumber(breakdown.totalSeats)}
          />
          <MetricCard
            label="Avg. deal"
            value={
              breakdown.totalPaidEvents > 0
                ? formatCurrencyFromCents(
                    Math.round(
                      breakdown.totalRevenueCents / breakdown.totalPaidEvents,
                    ),
                  )
                : "-"
            }
          />
        </div>
      </Panel>

      <Panel
        title="Revenue - last 12 months"
        description="Booked revenue by the month the event was created."
      >
        {hasRevenue ? (
          <TrendChart
            data={chartData}
            xKey="label"
            series={[{ key: "revenue", label: "Revenue", type: "bar" }]}
            valueFormat="currencyUsd"
          />
        ) : (
          <EmptyState
            title="No revenue yet"
            description="Once Stripe checkout is live and events move from demo to paid, monthly revenue will appear here."
          />
        )}
      </Panel>

      <Panel
        title="Events by payment status"
        description="How the full event catalog breaks down across billing states."
      >
        {breakdown.byStatus.length === 0 ? (
          <EmptyState title="No events yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.byStatus.map((s) => (
                <TableRow key={s.status}>
                  <TableCell className="font-medium text-foreground">
                    {paymentStatusLabel(s.status)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatNumber(s.count)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {s.revenueCents > 0
                      ? formatCurrencyFromCents(s.revenueCents)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
