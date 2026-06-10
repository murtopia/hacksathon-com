import { notFound, permanentRedirect } from "next/navigation";
import { resolveEventSlug } from "@/lib/routing/slug-context";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy event-home redirect. The slug-first refactor moved every
 * participant + admin URL under `/[slug]/...`. Existing participant
 * invite emails and bookmarks pointing at `/events/[uuid]` land here
 * and 301 forward to the new path.
 */
export default async function LegacyEventHomeRedirect({ params }: PageProps) {
  const { id } = await params;
  const slug = await resolveEventSlug(id);
  if (!slug) notFound();
  permanentRedirect(`/${slug}`);
}
