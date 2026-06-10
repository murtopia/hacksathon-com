import { notFound, permanentRedirect } from "next/navigation";
import { resolveEventSlug } from "@/lib/routing/slug-context";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyNewIdeaRedirect({ params }: PageProps) {
  const { id } = await params;
  const slug = await resolveEventSlug(id);
  if (!slug) notFound();
  permanentRedirect(`/${slug}/idea/new`);
}
