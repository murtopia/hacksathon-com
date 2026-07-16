import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MetricCard } from "@/components/murtopolis/metric-card";
import { EmptyState, Panel } from "@/components/murtopolis/panel";
import { EventProgressPanel } from "@/components/murtopolis/event-progress-panel";
import {
  getCustomerDetail,
  getCustomerEventProgress,
} from "@/lib/murtopolis/queries";
import {
  formatCurrencyFromCents,
  formatDate,
  formatNumber,
  paymentStatusLabel,
} from "@/lib/murtopolis/format";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";

type Params = Promise<{ orgId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { orgId } = await params;
  const detail = await getCustomerDetail(orgId);
  return { title: detail ? `Murtopolis - ${detail.summary.orgName}` : "Murtopolis" };
}

function paymentBadgeVariant(
  status: string | null,
): "default" | "outline" | "secondary" {
  if (status === "paid" || status === "completed") return "default";
  if (status === "demo") return "outline";
  return "secondary";
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { orgId } = await params;
  const [detail, progress] = await Promise.all([
    getCustomerDetail(orgId),
    getCustomerEventProgress(orgId),
  ]);
  if (!detail) notFound();

  const { summary, events, members } = detail;

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link
          href="/murtopolis/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All customers
        </Link>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-serif text-2xl text-foreground">
            {summary.orgName}
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            /{summary.vanitySlug ?? summary.orgSlug}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Customer since {formatDate(summary.createdAt)} · Last activity{" "}
          {summary.lastActiveAt
            ? formatRelativeUpdatedAt(summary.lastActiveAt)
            : "never"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={
            summary.revenueCents > 0
              ? formatCurrencyFromCents(summary.revenueCents)
              : "-"
          }
        />
        <MetricCard label="Seats" value={formatNumber(summary.seats)} />
        <MetricCard
          label="Members"
          value={formatNumber(summary.memberCount)}
        />
        <MetricCard label="Events" value={formatNumber(summary.eventCount)} />
      </div>

      <Panel
        title="Billing & contact"
        description="The buyer of record and Stripe linkage for this account."
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Admin contact">
            {summary.adminName ?? "-"}
            {summary.adminEmail && (
              <span className="block font-mono text-xs text-muted-foreground">
                {summary.adminEmail}
              </span>
            )}
          </Field>
          <Field label="Stripe customer">
            {summary.stripeCustomerId ? (
              <span className="font-mono text-xs">
                {summary.stripeCustomerId}
              </span>
            ) : (
              <span className="text-muted-foreground">Not linked</span>
            )}
          </Field>
          <Field label="Public URL">
            {summary.vanitySlug ? (
              <Link
                href={`/${summary.vanitySlug}`}
                className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
              >
                /{summary.vanitySlug}
                <ExternalLink className="size-3" />
              </Link>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </Field>
        </dl>
      </Panel>

      {progress.map((p) => (
        <EventProgressPanel
          key={p.eventId}
          progress={p}
          showEventTitle={progress.length > 1}
        />
      ))}

      <Panel
        title={`Events (${formatNumber(events.length)})`}
        description="Hackathons this customer has created."
      >
        {events.length === 0 ? (
          <EmptyState title="No events yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Seats</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-foreground">
                    {e.vanitySlug ? (
                      <Link
                        href={`/${e.vanitySlug}`}
                        className="hover:underline"
                      >
                        {e.title}
                      </Link>
                    ) : (
                      e.title
                    )}
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">
                    {e.status ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentBadgeVariant(e.paymentStatus)}>
                      {paymentStatusLabel(e.paymentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {e.participantLimit ? formatNumber(e.participantLimit) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {e.priceCents ? formatCurrencyFromCents(e.priceCents) : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.startDate ? formatDate(e.startDate) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Panel
        title={`Roster (${formatNumber(members.length)})`}
        description="Everyone who belongs to this customer's organization."
      >
        {members.length === 0 ? (
          <EmptyState title="No members" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.userId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={m.fullName}
                        email={m.email}
                        avatarUrl={m.avatarUrl}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <span className="block truncate text-sm text-foreground">
                          {m.fullName ?? m.email}
                        </span>
                        {m.fullName && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {m.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                      {m.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">
                    {m.status}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.lastActiveAt
                      ? formatRelativeUpdatedAt(m.lastActiveAt)
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="mono-label" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}
