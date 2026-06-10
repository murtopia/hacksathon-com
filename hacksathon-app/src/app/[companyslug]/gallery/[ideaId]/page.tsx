import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ companyslug: string; ideaId: string }>;
}

/**
 * Backward-compat redirect from the old `/[slug]/gallery/[ideaId]`
 * detail route to the renamed `/[slug]/idealab/[ideaId]`.
 */
export default async function LegacyGalleryIdeaRedirect({
  params,
}: PageProps) {
  const { companyslug, ideaId } = await params;
  permanentRedirect(`/${companyslug}/idealab/${ideaId}`);
}
