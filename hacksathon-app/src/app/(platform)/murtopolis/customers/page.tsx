import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MurtopolisToolbar } from "@/components/murtopolis/murtopolis-toolbar";
import {
  EmptyState,
  Panel,
  PaymentStateBadge,
  PhaseBadge,
} from "@/components/murtopolis/panel";
import {
  listCustomers,
  type CustomerListFilter,
} from "@/lib/murtopolis/queries";
import {
  formatCurrencyFromCents,
  formatNumber,
  formatDate,
} from "@/lib/murtopolis/format";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";

export const metadata = { title: "Murtopolis - Customers" };

type SearchParams = Promise<{
  q?: string;
  state?: string;
  sort?: string;
}>;

const SORTS = new Set(["recent", "revenue", "name", "members"]);
const STATES = new Set(["all", "paid", "comped", "demo", "none", "test"]);

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const state = STATES.has(sp.state ?? "") ? (sp.state as string) : "all";
  const sort = SORTS.has(sp.sort ?? "") ? (sp.sort as string) : "recent";

  const customers = await listCustomers({
    search: q,
    paymentState: state as CustomerListFilter,
    sort: sort as "recent" | "revenue" | "name" | "members",
  });

  return (
    <Panel
      title={`Customers (${formatNumber(customers.length)})`}
      description="Every organization on the platform. Click a row to open the full record."
    >
      <MurtopolisToolbar
        searchParam="q"
        searchValue={q}
        searchPlaceholder="Search name, slug, contact…"
        filters={[
          {
            param: "state",
            label: "Billing",
            value: state,
            options: [
              { value: "all", label: "All" },
              { value: "paid", label: "Paying" },
              { value: "comped", label: "Comped" },
              { value: "demo", label: "Demo" },
              { value: "none", label: "No event" },
              { value: "test", label: "Test" },
            ],
          },
          {
            param: "sort",
            label: "Sort",
            value: sort,
            options: [
              { value: "recent", label: "Newest" },
              { value: "revenue", label: "Revenue" },
              { value: "members", label: "Members" },
              { value: "name", label: "Name" },
            ],
          },
        ]}
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers match"
          description="Try clearing the search or billing filter."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.orgId} className="group">
                <TableCell>
                  <Link
                    href={`/murtopolis/customers/${c.orgId}`}
                    className="block font-medium text-foreground hover:underline"
                  >
                    {c.orgName}
                  </Link>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    /{c.vanitySlug ?? c.orgSlug}
                  </span>
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <span className="block truncate text-sm text-foreground">
                    {c.adminName ?? "-"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.adminEmail ?? "No contact"}
                  </span>
                </TableCell>
                <TableCell>
                  <PaymentStateBadge
                    state={c.paymentState}
                    isInternal={c.isInternal}
                  />
                </TableCell>
                <TableCell>
                  {c.phase ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PhaseBadge phase={c.phase} />
                      {c.warnFlagCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-red-600"
                          title={`${c.warnFlagCount} roadblock ${c.warnFlagCount === 1 ? "flag" : "flags"}`}
                        >
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-red-500"
                          />
                          {c.warnFlagCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatNumber(c.memberCount)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {c.revenueCents > 0
                    ? formatCurrencyFromCents(c.revenueCents)
                    : "-"}
                </TableCell>
                <TableCell
                  className="text-muted-foreground"
                  title={formatDate(c.createdAt)}
                >
                  {formatRelativeUpdatedAt(c.createdAt)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/murtopolis/customers/${c.orgId}`}
                    aria-label={`Open ${c.orgName}`}
                    className="inline-flex text-[var(--text-tertiary)] transition-colors hover:text-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
