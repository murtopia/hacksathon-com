import { notFound, permanentRedirect } from "next/navigation";
import { resolveEventSlug } from "@/lib/routing/slug-context";

interface PageProps {
  params: Promise<{ id: string; ideaId: string }>;
}

export default async function LegacyIdeaDetailRedirect({ params }: PageProps) {
  const { id, ideaId } = await params;
  const slug = await resolveEventSlug(id);
  if (!slug) notFound();
  permanentRedirect(`/${slug}/idealab/${ideaId}`);
}
