import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MurtopolisToolbar } from "@/components/murtopolis/murtopolis-toolbar";
import { EmptyState, Panel } from "@/components/murtopolis/panel";
import { listWaitlist } from "@/lib/murtopolis/queries";
import { formatDate, formatNumber } from "@/lib/murtopolis/format";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";

export const metadata = { title: "Murtopolis - Waitlist" };

type SearchParams = Promise<{
  q?: string;
  team?: string;
  source?: string;
  notified?: string;
}>;

const NOTIFIED = new Set(["all", "notified", "pending"]);

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const team = sp.team ?? "all";
  const source = sp.source ?? "all";
  const notified = NOTIFIED.has(sp.notified ?? "")
    ? (sp.notified as "all" | "notified" | "pending")
    : "all";

  const { rows, total, teamSizes, sources } = await listWaitlist({
    search: q,
    teamSize: team,
    source,
    notified,
  });

  return (
    <Panel
      title={`Waitlist (${formatNumber(total)})`}
      description="Pre-launch marketing leads captured from the public waitlist page."
    >
      <MurtopolisToolbar
        searchParam="q"
        searchValue={q}
        searchPlaceholder="Search name, email, company…"
        filters={[
          {
            param: "team",
            label: "Team size",
            value: team,
            options: [
              { value: "all", label: "All" },
              ...teamSizes.map((t) => ({ value: t, label: t })),
            ],
          },
          {
            param: "source",
            label: "Source",
            value: source,
            options: [
              { value: "all", label: "All" },
              ...sources.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            param: "notified",
            label: "Status",
            value: notified,
            options: [
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "notified", label: "Notified" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No signups match"
          description="Try clearing the filters."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Team size</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Signed up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-foreground">
                  {r.name}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.email}</TableCell>
                <TableCell className="text-sm">{r.company}</TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                  {r.teamSize}
                </TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {r.source}
                </TableCell>
                <TableCell>
                  {r.notifiedAt ? (
                    <Badge variant="default">Notified</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell
                  className="text-sm text-muted-foreground"
                  title={formatDate(r.createdAt)}
                >
                  {formatRelativeUpdatedAt(r.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
