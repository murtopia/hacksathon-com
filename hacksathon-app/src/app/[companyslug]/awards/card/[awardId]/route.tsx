import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReservedSlug } from "@/lib/routing/reserved-slugs";

/**
 * Shareable winner card - a 1080×1080 PNG for Slack / LinkedIn.
 *
 * Grayscale to match the design system: warm off-white ground, ink
 * type, a diamond motif, the winning project + author, and the
 * event/company footer. Only served once results are published
 * (results_published_at) so cards can't leak before the ceremony.
 *
 * Keyed on awardId (which the public WinnersGrid already has).
 *
 * `?preview=1` short-circuits to a generic sample card (placeholder
 * winner + optional `label` category) with no DB/auth/published gate,
 * so the organizer can see the card format before the ceremony. No
 * real or private data is exposed in preview.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ companyslug: string; awardId: string }> },
) {
  const { companyslug, awardId } = await params;
  const slug = companyslug.toLowerCase();
  if (isReservedSlug(slug)) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("preview") === "1") {
    const label = url.searchParams.get("label")?.trim() || "Hacky Award";
    return renderCard({
      categoryName: label,
      winnerName: "Sample Winning Project",
      footer: "Hacks-a-Thon · Sample preview",
    });
  }

  const admin = createAdminClient();

  const { data: award } = await admin
    .from("awards")
    .select(
      `winner_name, project_title,
       events!inner(title, vanity_slug, results_published_at, organizations(name)),
       award_categories!inner(name)`,
    )
    .eq("id", awardId)
    .maybeSingle();

  if (!award) return new Response("Not found", { status: 404 });

  const eventRel = award.events as
    | {
        title: string;
        vanity_slug: string | null;
        results_published_at: string | null;
        organizations: { name: string } | { name: string }[] | null;
      }
    | {
        title: string;
        vanity_slug: string | null;
        results_published_at: string | null;
        organizations: { name: string } | { name: string }[] | null;
      }[]
    | null;
  const event = Array.isArray(eventRel) ? eventRel[0] : eventRel;

  // Gate: must belong to this slug and be published.
  if (
    !event ||
    !event.results_published_at ||
    (event.vanity_slug ?? "").toLowerCase() !== slug
  ) {
    return new Response("Not found", { status: 404 });
  }

  const categoryRel = award.award_categories as
    | { name: string }
    | { name: string }[]
    | null;
  const category = Array.isArray(categoryRel) ? categoryRel[0] : categoryRel;

  const orgRel = event.organizations;
  const orgName = Array.isArray(orgRel)
    ? orgRel[0]?.name ?? null
    : orgRel?.name ?? null;

  const winnerName =
    (award.project_title as string | null)?.trim() ||
    (award.winner_name as string | null)?.trim() ||
    "Winner";
  const categoryName = category?.name ?? "Hacky Award";
  const footer = orgName
    ? `${orgName} Hacks-a-Thon · ${event.title}`
    : event.title;

  return renderCard({ categoryName, winnerName, footer });
}

function renderCard({
  categoryName,
  winnerName,
  footer,
}: {
  categoryName: string;
  winnerName: string;
  footer: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px",
          height: "1080px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f4f2",
          color: "#111110",
          padding: "96px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 40,
            color: "#71717a",
            letterSpacing: 12,
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          {categoryName}
        </div>
        <div style={{ fontSize: 64, color: "#52525b", marginBottom: 28 }}>
          {"\u25C6"}
        </div>
        <div
          style={{
            fontSize: winnerName.length > 28 ? 84 : 116,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 880,
            display: "flex",
            textAlign: "center",
          }}
        >
          {winnerName}
        </div>
        <div
          style={{
            marginTop: 64,
            paddingTop: 28,
            borderTop: "2px solid #d4d4d8",
            fontSize: 32,
            color: "#71717a",
            display: "flex",
          }}
        >
          {footer}
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
