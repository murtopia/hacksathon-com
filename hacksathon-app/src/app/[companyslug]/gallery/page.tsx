import { permanentRedirect } from "next/navigation";

interface PageProps {
  params: Promise<{ companyslug: string }>;
}

/**
 * Backward-compat redirect - the participant surface was renamed from
 * "Gallery" to "IdeaLab". This stub keeps existing bookmarks and any
 * external links pointing at `/[slug]/gallery` working by sending
 * them to the new `/[slug]/idealab` route.
 */
export default async function LegacyGalleryRedirect({ params }: PageProps) {
  const { companyslug } = await params;
  permanentRedirect(`/${companyslug}/idealab`);
}
