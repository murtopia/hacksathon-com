import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, Panel } from "@/components/murtopolis/panel";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatNumber } from "@/lib/murtopolis/format";
import { formatRelativeUpdatedAt } from "@/lib/idealab/format-relative-date";
import {
  CopyLinkButton,
  CreateLinkForm,
  DeleteLinkButton,
} from "./link-controls";

export const metadata = { title: "Murtopolis - Links" };

interface ShortLinkRow {
  id: string;
  slug: string;
  destination: string;
  click_count: number;
  created_at: string;
}

/**
 * Campaign short links: create /go/<slug> URLs that redirect to any
 * destination (usually a marketing page with UTM parameters), so posts
 * and printed materials show a clean branded URL. Served by
 * src/app/go/[slug]/route.ts; access is gated by the murtopolis layout.
 */
export default async function LinksPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("short_links")
    .select("id, slug, destination, click_count, created_at")
    .order("created_at", { ascending: false });
  const links = (data ?? []) as ShortLinkRow[];

  return (
    <Panel
      title={`Short links (${formatNumber(links.length)})`}
      description="Branded /go/ URLs for campaigns. Clean in the post, full UTM tracking on landing. To re-point a link, delete it and recreate the same slug."
    >
      <CreateLinkForm />

      {links.length === 0 ? (
        <EmptyState
          title="No short links yet"
          description="Create one above: pick a slug, paste the destination URL with its UTM parameters."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Short link</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-mono text-xs font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    /go/{link.slug}
                    <CopyLinkButton slug={link.slug} />
                  </span>
                </TableCell>
                <TableCell
                  className="max-w-[360px] truncate font-mono text-[11px] text-muted-foreground"
                  title={link.destination}
                >
                  {link.destination}
                </TableCell>
                <TableCell className="text-right font-mono text-xs tabular-nums">
                  {formatNumber(link.click_count)}
                </TableCell>
                <TableCell
                  className="text-sm text-muted-foreground"
                  title={formatDate(link.created_at)}
                >
                  {formatRelativeUpdatedAt(link.created_at)}
                </TableCell>
                <TableCell>
                  <DeleteLinkButton id={link.id} slug={link.slug} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
