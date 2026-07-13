import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  resolveSlugContext,
  resolveSlugViewer,
  slugPath,
} from "@/lib/routing/slug-context";
import { loadCeremonyData } from "@/lib/awards/ceremony-data";
import { CeremonyPresentation } from "@/components/admin/awards/ceremony-presentation";

export const metadata: Metadata = {
  title: "Hacky Awards Ceremony",
};

interface PageProps {
  params: Promise<{ companyslug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

/**
 * Full-screen Hacky Awards ceremony presenter - admin-only.
 *
 * Available once voting is `revealed` (winners tallied + locked). The
 * client component covers the admin chrome with a fixed full-screen
 * overlay and drives the slideshow. Publishing results happens from the
 * finale slide (or the awards controls).
 *
 * `?preview=1` is a rehearsal mode: it skips the "revealed" gate and
 * fills placeholder winners so the organizer can walk the flow before
 * voting closes. Nothing is published in preview.
 */
export default async function CeremonyPage({ params, searchParams }: PageProps) {
  const { companyslug } = await params;
  const { preview: previewParam } = await searchParams;
  const preview = previewParam === "1";

  const ctx = await resolveSlugContext(companyslug);
  if (!ctx) notFound();

  const viewer = await resolveSlugViewer(companyslug);
  if (!viewer)
    redirect(
      `/login?next=${encodeURIComponent(slugPath(ctx.slug, "admin/awards/ceremony"))}`,
    );
  if (!viewer.isAdmin) redirect(slugPath(ctx.slug));

  // The ceremony only makes sense once voting has been closed/tallied -
  // except in preview, which is meant to be run beforehand.
  if (!preview && ctx.event.voting_status !== "revealed") {
    redirect(slugPath(ctx.slug, "admin/awards"));
  }

  const { categories, meta } = await loadCeremonyData(ctx.event.id);

  return (
    <CeremonyPresentation
      eventId={ctx.event.id}
      slug={ctx.slug}
      categories={categories}
      meta={meta}
      alreadyPublished={Boolean(ctx.event.results_published_at)}
      preview={preview}
    />
  );
}
