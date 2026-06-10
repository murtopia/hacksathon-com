import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MurtopolisToolbar } from "@/components/murtopolis/murtopolis-toolbar";
import { EmptyState, Panel } from "@/components/murtopolis/panel";
import { listUsers } from "@/lib/murtopolis/queries";
import { formatDate, formatNumber } from "@/lib/murtopolis/format";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";

export const metadata = { title: "Murtopolis - Users" };

type SearchParams = Promise<{ q?: string; role?: string }>;

const ROLES = new Set(["all", "admin", "participant"]);

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const role = ROLES.has(sp.role ?? "") ? (sp.role as string) : "all";

  // Pull the search-matched set once so the filter pills can show live counts,
  // then narrow by role for the table.
  const matched = await listUsers({ search: q });
  const adminCount = matched.filter((u) => u.isAdminSomewhere).length;
  const participantCount = matched.length - adminCount;
  const users =
    role === "admin"
      ? matched.filter((u) => u.isAdminSomewhere)
      : role === "participant"
        ? matched.filter((u) => !u.isAdminSomewhere)
        : matched;

  return (
    <Panel
      title={`Users (${formatNumber(users.length)})`}
      description="Every individual account on the platform, across all organizations."
    >
      <MurtopolisToolbar
        searchParam="q"
        searchValue={q}
        searchPlaceholder="Search name or email…"
        filters={[
          {
            param: "role",
            label: "Role",
            value: role,
            options: [
              {
                value: "all",
                label: `All (${formatNumber(matched.length)})`,
              },
              {
                value: "admin",
                label: `Admins (${formatNumber(adminCount)})`,
              },
              {
                value: "participant",
                label: `Participants (${formatNumber(participantCount)})`,
              },
            ],
          },
        ]}
      />

      {users.length === 0 ? (
        <EmptyState
          title="No users match"
          description="Try a different search."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Orgs</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      name={u.fullName}
                      email={u.email}
                      avatarUrl={u.avatarUrl}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-foreground">
                        {u.fullName ?? u.email}
                      </span>
                      {u.fullName && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {formatNumber(u.orgCount)}
                </TableCell>
                <TableCell>
                  {u.isAdminSomewhere ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Participant</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.lastActiveAt
                    ? formatRelativeUpdatedAt(u.lastActiveAt)
                    : "-"}
                </TableCell>
                <TableCell
                  className="text-sm text-muted-foreground"
                  title={formatDate(u.createdAt)}
                >
                  {formatRelativeUpdatedAt(u.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
