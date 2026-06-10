import { notFound, permanentRedirect } from "next/navigation";
import { resolveEventSlug } from "@/lib/routing/slug-context";

interface PageProps {
  params: Promise<{ id: string; blockKey: string }>;
}

export default async function LegacyBlockRedirect({ params }: PageProps) {
  const { id, blockKey } = await params;
  const slug = await resolveEventSlug(id);
  if (!slug) notFound();
  permanentRedirect(`/${slug}/blocks/${blockKey}`);
}
